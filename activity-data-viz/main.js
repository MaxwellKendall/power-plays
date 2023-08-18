// configuration
const MOCK_API = false;
const MAX_PAGES = 10; // 200 items of data
const sdk = window.muralSdk || null;

/**
 * SDK notes:
 * test using the console
  var activityClient = await sdkContext.activity.get()
  var data = await activityClient.getActivityFromApi(activityClient.muralId) // returns first page
 */ 
/**
 * 
 * @param {*} activityByDay 
 * @param {*} activityRecord
    action:"UPDATE_WIDGET"
    content: htmlText: '<div>No plans for removing classic features</div>', text: '', lastUpdate: 1689871486372, ...}
    id: "64b9647ea5ed9d980cba56a1"
    timestamp: 1689871486373
    user: "ud42767f4c808ed3fa99d2263"
    widget: { id: '0-1689868811501', owner: 'ud42767f4c808ed3fa99d2263', properties: {…}, ...}
    widgets: null (?)
    widgetsErrors: null
    withErrors: false
 * @returns 
 */
const scoreActivityByDay = (activityByDay, activityRecord) => {
    const { user, timestamp } = activityRecord;
    const date = moment(timestamp).format("MM-DD-YYYY HH")
    if (activityByDay[date]) {
        return {
            ...activityByDay,
            [date]: activityByDay[date] + 1
        }
    }
    return {
        ...activityByDay,
        [date]: 1
    }
}
let pagesFetched = 0;
(async () => {
    // DOM components
    const loadingIndicator = document.querySelector('.loading');

    const activityClient = MOCK_API ? null : sdk.activity.get();
    const fetchAllActivity = async (token = null, prevPages = []) => {
        if (MOCK_API) return Promise.resolve(mockData)
        console.log(`fetching activity page ${pagesFetched}...`)
        pagesFetched += 1;
        const resp = await activityClient.getActivityFromApi(activityClient.muralId, token)
        if (resp.prevToken && pagesFetched <= MAX_PAGES) {
            return fetchAllActivity(resp.prevToken, prevPages.concat(resp.data))
        };
        return prevPages.concat([data.data]);
    }
    const data = await fetchAllActivity();
    loadingIndicator.classList.add('hide');
    
    console.log({ data });

    const activityByDay = data.reduce(scoreActivityByDay, {});
    const activitiesDedupedByDayWithScore = Object
        .keys(activityByDay)
        .sort((a, b) => new Date(a) - new Date(b))
        .map(date => ({ Date: date, ActivityCount: activityByDay[date] }))

    console.log({ activityByDay, activitiesDedupedByDayWithScore });

    // Taken from d3 documentation: https://d3-graph-gallery.com/graph/barplot_basic.html
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    
    // X axis
    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(Object.keys(activityByDay))
        .padding(0.2);
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, Math.max(...Object.values(activityByDay))])
        .range([ height, 0]);
    
    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("mybar")
        .data(activitiesDedupedByDayWithScore)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.Date); })
        .attr("y", function(d) { return y(d.ActivityCount); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.ActivityCount); })
        .attr("fill", "#69b3a2")
})()
