/**
 * The Economics of Dying Young
 * Interactive Data Brief - JavaScript
 * =========================================
 * Uses embedded county data from data.js (3,080 counties)
 */

// Global state and colors
const quartileColors = {
    'Poorest Quartile': '#ef4444',
    'Lower Middle': '#f97316',
    'Upper Middle': '#22c55e',
    'Wealthiest Quartile': '#3b82f6'
};

let countyData = [];
let stateStats = {};
let currentFilterState = 'all';
let currentFilterQuartile = 'all';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        loadData();
        if (countyData.length > 0) {
            calculateStateStats();
            initScatterPlot();
            initBarChart();
            initStateHeatmap();
            initExtremeComparison();
            setupFilters();
            setupHeatmapControls();
            setupCountySearch();
        }
    } catch (error) {
        console.error('Error initializing visualizations:', error);
    }
});

/**
 * Load data from embedded COUNTY_DATA (from data.js)
 */
function loadData() {
    if (typeof COUNTY_DATA !== 'undefined' && Array.isArray(COUNTY_DATA)) {
        // Convert compressed format to full format
        countyData = COUNTY_DATA.map(d => ({
            'State': d.S,
            'County': d.C,
            'Premature Death Rate (YPLL)': d.Y,
            'Median Household Income': d.I,
            'Population': d.P,
            'Poor or Fair Health %': d.H / 100,  // Convert back to decimal
            'Children in Poverty %': d.CP / 100, // Convert back to decimal
            'Income Quartile': d.Q,
            'Comparison Group': d.G,
            'Location': d.L || (d.C + ', ' + d.S)
        })).filter(d => d['Premature Death Rate (YPLL)'] > 0 && d['Median Household Income'] > 0);

        console.log(`Loaded ${countyData.length} counties from embedded data`);
    } else {
        console.error('COUNTY_DATA not found - ensure data.js is loaded');
        countyData = [];
    }
}

/**
 * Calculate state-level statistics
 */
function calculateStateStats() {
    stateStats = {};

    countyData.forEach(d => {
        const state = d['State'];
        if (!stateStats[state]) {
            stateStats[state] = {
                state: state,
                totalDeathRate: 0,
                totalIncome: 0,
                totalPoorHealth: 0,
                totalChildPoverty: 0,
                countyCount: 0
            };
        }
        stateStats[state].totalDeathRate += d['Premature Death Rate (YPLL)'];
        stateStats[state].totalIncome += d['Median Household Income'];
        stateStats[state].totalPoorHealth += d['Poor or Fair Health %'];
        stateStats[state].totalChildPoverty += d['Children in Poverty %'];
        stateStats[state].countyCount += 1;
    });

    // Calculate averages
    Object.values(stateStats).forEach(s => {
        s.avgDeathRate = s.totalDeathRate / s.countyCount;
        s.avgIncome = s.totalIncome / s.countyCount;
        s.avgPoorHealth = s.totalPoorHealth / s.countyCount;
        s.avgChildPoverty = s.totalChildPoverty / s.countyCount;
    });
}

/**
 * Scatter Plot: Income vs Premature Death Rate
 */
function initScatterPlot() {
    const container = document.getElementById('scatter-plot');
    container.innerHTML = '';

    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select('#scatter-plot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain([20000, d3.max(countyData, d => d['Median Household Income']) * 1.02])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(countyData, d => d['Premature Death Rate (YPLL)']) * 1.02])
        .range([height, 0]);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(countyData, d => d['Population'])])
        .range([2, 18]);

    // Gridlines
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(''))
        .selectAll('line')
        .style('stroke', 'rgba(255,255,255,0.06)');

    svg.selectAll('.grid .domain').style('stroke', 'none');

    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''))
        .selectAll('line')
        .style('stroke', 'rgba(255,255,255,0.06)');

    // Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `$${d / 1000}k`))
        .selectAll('text')
        .style('fill', '#a0a0b0');

    svg.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d.toLocaleString()))
        .selectAll('text')
        .style('fill', '#a0a0b0');

    // Style axis lines
    svg.selectAll('.domain').style('stroke', '#444');
    svg.selectAll('.tick line').style('stroke', '#444');

    // Axis Labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .attr('text-anchor', 'middle')
        .style('fill', '#a0a0b0')
        .style('font-size', '14px')
        .text('Median Household Income');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .style('fill', '#a0a0b0')
        .style('font-size', '14px')
        .text('Premature Death Rate (YPLL per 100,000)');

    // Trend line
    const xMean = d3.mean(countyData, d => d['Median Household Income']);
    const yMean = d3.mean(countyData, d => d['Premature Death Rate (YPLL)']);

    let numerator = 0;
    let denominator = 0;
    countyData.forEach(d => {
        numerator += (d['Median Household Income'] - xMean) * (d['Premature Death Rate (YPLL)'] - yMean);
        denominator += Math.pow(d['Median Household Income'] - xMean, 2);
    });

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    const xMin = d3.min(countyData, d => d['Median Household Income']);
    const xMax = d3.max(countyData, d => d['Median Household Income']);

    svg.append('line')
        .attr('x1', xScale(xMin))
        .attr('y1', yScale(Math.max(0, slope * xMin + intercept)))
        .attr('x2', xScale(xMax))
        .attr('y2', yScale(Math.max(0, slope * xMax + intercept)))
        .style('stroke', 'rgba(139, 92, 246, 0.6)')
        .style('stroke-width', 3)
        .style('stroke-dasharray', '10,5');

    // Data points - use sampling for performance if needed
    const dataToPlot = countyData;

    svg.selectAll('circle')
        .data(dataToPlot)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d['Median Household Income']))
        .attr('cy', d => yScale(d['Premature Death Rate (YPLL)']))
        .attr('r', d => Math.max(3, sizeScale(d['Population'])))
        .attr('fill', d => quartileColors[d['Income Quartile']] || '#888')
        .attr('fill-opacity', 0.8)
        .attr('stroke', d => quartileColors[d['Income Quartile']] || '#888')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            // Only highlight if not filtered out
            const stateMatch = currentFilterState === 'all' || d.State === currentFilterState;
            const quartileMatch = currentFilterQuartile === 'all' || d['Income Quartile'] === currentFilterQuartile;
            if (stateMatch && quartileMatch) {
                d3.select(this)
                    .attr('fill-opacity', 1)
                    .attr('stroke-width', 2.5)
                    .attr('r', Math.max(5, sizeScale(d['Population']) * 1.5));
                showTooltip(event, d);
            }
        })
        .on('mousemove', function (event, d) {
            const stateMatch = currentFilterState === 'all' || d.State === currentFilterState;
            const quartileMatch = currentFilterQuartile === 'all' || d['Income Quartile'] === currentFilterQuartile;
            if (stateMatch && quartileMatch) {
                moveTooltip(event);
            }
        })
        .on('mouseout', function (event, d) {
            const stateMatch = currentFilterState === 'all' || d.State === currentFilterState;
            const quartileMatch = currentFilterQuartile === 'all' || d['Income Quartile'] === currentFilterQuartile;
            d3.select(this)
                .attr('fill-opacity', stateMatch && quartileMatch ? 0.8 : 0.03)
                .attr('stroke-width', 1)
                .attr('r', Math.max(3, sizeScale(d['Population'])));
            hideTooltip();
        });

    // Legend
    const legend = document.getElementById('scatter-legend');
    if (legend) {
        legend.innerHTML = Object.entries(quartileColors).map(([label, color]) => `
            <div class="legend-item">
                <span class="legend-dot" style="background: ${color}"></span>
                <span>${label}</span>
            </div>
        `).join('') + `<div class="legend-item"><span style="color:#8b5cf6">- - -</span><span>Trend Line</span></div>`;
    }
}

/**
 * Bar Chart: Average Death Rate by Quartile
 */
function initBarChart() {
    const quartileStats = {};

    Object.keys(quartileColors).forEach(q => {
        const counties = countyData.filter(d => d['Income Quartile'] === q);
        if (counties.length > 0) {
            quartileStats[q] = {
                avgDeathRate: d3.mean(counties, d => d['Premature Death Rate (YPLL)']),
                avgIncome: d3.mean(counties, d => d['Median Household Income']),
                avgPoorHealth: d3.mean(counties, d => d['Poor or Fair Health %']),
                count: counties.length
            };
        }
    });

    const ctx = document.getElementById('bar-chart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(quartileStats),
            datasets: [{
                label: 'Average Premature Death Rate (YPLL per 100,000)',
                data: Object.values(quartileStats).map(s => Math.round(s.avgDeathRate)),
                backgroundColor: Object.keys(quartileStats).map(q => quartileColors[q] + 'CC'),
                borderColor: Object.keys(quartileStats).map(q => quartileColors[q]),
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 80
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(20, 20, 30, 0.95)',
                    titleColor: '#f4f4f8',
                    bodyColor: '#a0a0b0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 16,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: ctx => ctx[0].label,
                        label: function (context) {
                            const stats = quartileStats[context.label];
                            return [
                                `Avg Death Rate: ${Math.round(stats.avgDeathRate).toLocaleString()} YPLL`,
                                `Avg Income: $${Math.round(stats.avgIncome).toLocaleString()}`,
                                `Counties: ${stats.count.toLocaleString()}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#a0a0b0', font: { size: 12 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#a0a0b0', callback: v => v.toLocaleString() },
                    title: { display: true, text: 'YPLL per 100,000', color: '#a0a0b0' }
                }
            },
            animation: { duration: 1200, easing: 'easeOutQuart' }
        }
    });
}

/**
 * State Heatmap - Sortable and Color-configurable
 */
let currentHeatmapSort = 'avgChildPoverty-desc';
let currentHeatmapColor = 'avgDeathRate';

function initStateHeatmap() {
    renderStateHeatmap();
}

function renderStateHeatmap() {
    const stateArray = Object.values(stateStats);
    if (stateArray.length === 0) return;

    // Parse sort option
    const [sortKey, sortDir] = currentHeatmapSort.split('-');

    // Sort states
    stateArray.sort((a, b) => {
        let valA = sortKey === 'state' ? a.state : a[sortKey];
        let valB = sortKey === 'state' ? b.state : b[sortKey];
        if (typeof valA === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    // Get color scale based on selected metric
    const colorMetric = currentHeatmapColor;
    const values = stateArray.map(s => s[colorMetric]);
    const minVal = d3.min(values);
    const maxVal = d3.max(values);

    // Choose color scheme based on metric
    let colorScale;
    if (colorMetric === 'avgIncome') {
        // Higher income = green (good)
        colorScale = d3.scaleSequential()
            .domain([minVal, maxVal])
            .interpolator(d3.interpolateRgb('#ef4444', '#22c55e'));
    } else {
        // Higher death rate/poverty/poor health = red (bad)
        colorScale = d3.scaleSequential()
            .domain([minVal, maxVal])
            .interpolator(d3.interpolateRgb('#22c55e', '#ef4444'));
    }

    const container = document.getElementById('state-heatmap');
    if (!container) return;

    // Render heatmap cells
    container.innerHTML = stateArray.map(d => {
        const colorValue = d[colorMetric];
        const bgColor = colorScale(colorValue);
        const textColor = colorValue > (minVal + maxVal) / 2 ? '#fff' : '#111';

        return `
            <div class="state-cell" 
                 style="background: ${bgColor}; color: ${textColor}"
                 data-state="${d.state}">
                <span class="state-abbr">${d.state}</span>
                <span class="state-value">${formatHeatmapValue(colorMetric, colorValue)}</span>
            </div>
        `;
    }).join('');

    // Add hover events
    container.querySelectorAll('.state-cell').forEach(cell => {
        cell.addEventListener('mouseenter', function (e) {
            const state = this.dataset.state;
            const stats = stateStats[state];
            showStateTooltip(e, stats);
        });
        cell.addEventListener('mousemove', moveTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });

    // Update legend
    updateHeatmapLegend(colorMetric, minVal, maxVal, colorScale);
}

function formatHeatmapValue(metric, value) {
    switch (metric) {
        case 'avgDeathRate': return Math.round(value).toLocaleString();
        case 'avgIncome': return '$' + Math.round(value / 1000) + 'k';
        case 'avgChildPoverty': return (value * 100).toFixed(1) + '%';
        case 'avgPoorHealth': return (value * 100).toFixed(1) + '%';
        default: return Math.round(value);
    }
}

function updateHeatmapLegend(metric, minVal, maxVal, colorScale) {
    const legend = document.getElementById('heatmap-legend');
    if (!legend) return;

    const labels = {
        'avgDeathRate': 'Premature Death Rate (YPLL per 100k)',
        'avgIncome': 'Median Household Income',
        'avgChildPoverty': 'Child Poverty Rate',
        'avgPoorHealth': 'Poor/Fair Health Rate'
    };

    legend.innerHTML = `
        <div class="legend-bar">
            <span class="legend-min">${formatHeatmapValue(metric, minVal)}</span>
            <div class="legend-gradient" style="background: linear-gradient(to right, ${colorScale(minVal)}, ${colorScale((minVal + maxVal) / 2)}, ${colorScale(maxVal)})"></div>
            <span class="legend-max">${formatHeatmapValue(metric, maxVal)}</span>
        </div>
        <div class="legend-label">${labels[metric] || metric}</div>
    `;
}

function showStateTooltip(event, stats) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = `
        <div class="tooltip-title">${stats.state}</div>
        <div class="tooltip-row">
            <span class="tooltip-label">Avg Death Rate:</span>
            <span class="tooltip-value">${Math.round(stats.avgDeathRate).toLocaleString()} YPLL</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Avg Income:</span>
            <span class="tooltip-value">$${Math.round(stats.avgIncome).toLocaleString()}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Avg Child Poverty:</span>
            <span class="tooltip-value">${(stats.avgChildPoverty * 100).toFixed(1)}%</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Avg Poor Health:</span>
            <span class="tooltip-value">${(stats.avgPoorHealth * 100).toFixed(1)}%</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Counties:</span>
            <span class="tooltip-value">${stats.countyCount}</span>
        </div>
    `;

    tooltip.classList.add('visible');
    moveTooltip(event);
}

function setupHeatmapControls() {
    const sortSelect = document.getElementById('heatmap-sort');
    const colorSelect = document.getElementById('heatmap-color');

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentHeatmapSort = e.target.value;
            renderStateHeatmap();
        });
    }

    if (colorSelect) {
        colorSelect.addEventListener('change', (e) => {
            currentHeatmapColor = e.target.value;
            renderStateHeatmap();
        });
    }
}

/**
 * Extreme Comparison (Richest vs Poorest)
 */
function initExtremeComparison() {
    const richest = countyData
        .filter(d => d['Comparison Group'] === 'Top 10 Richest Counties')
        .sort((a, b) => b['Median Household Income'] - a['Median Household Income']);

    const poorest = countyData
        .filter(d => d['Comparison Group'] === 'Bottom 10 Poorest Counties')
        .sort((a, b) => a['Median Household Income'] - b['Median Household Income']);

    if (richest.length > 0) {
        const avgRichIncome = d3.mean(richest, d => d['Median Household Income']);
        const avgRichDeath = d3.mean(richest, d => d['Premature Death Rate (YPLL)']);

        const el1 = document.getElementById('richest-income');
        const el2 = document.getElementById('richest-death');
        const el3 = document.getElementById('richest-list');

        if (el1) el1.textContent = '$' + Math.round(avgRichIncome).toLocaleString();
        if (el2) el2.textContent = Math.round(avgRichDeath).toLocaleString();
        if (el3) el3.innerHTML = richest.slice(0, 5).map(d =>
            `<li>${d.County}, ${d.State} - $${Math.round(d['Median Household Income']).toLocaleString()}</li>`
        ).join('');
    }

    if (poorest.length > 0) {
        const avgPoorIncome = d3.mean(poorest, d => d['Median Household Income']);
        const avgPoorDeath = d3.mean(poorest, d => d['Premature Death Rate (YPLL)']);

        const el1 = document.getElementById('poorest-income');
        const el2 = document.getElementById('poorest-death');
        const el3 = document.getElementById('poorest-list');

        if (el1) el1.textContent = '$' + Math.round(avgPoorIncome).toLocaleString();
        if (el2) el2.textContent = Math.round(avgPoorDeath).toLocaleString();
        if (el3) el3.innerHTML = poorest.slice(0, 5).map(d =>
            `<li>${d.County}, ${d.State} - $${Math.round(d['Median Household Income']).toLocaleString()}</li>`
        ).join('');
    }
}

/**
 * Setup Filter Controls for Scatter Plot
 */
function setupFilters() {
    const stateFilter = document.getElementById('state-filter');
    const quartileFilter = document.getElementById('quartile-filter');

    if (!stateFilter || !quartileFilter) return;

    // Populate state dropdown
    const states = [...new Set(countyData.map(d => d.State))].sort();
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateFilter.appendChild(option);
    });

    // Filter handlers
    const applyFilters = () => {
        currentFilterState = stateFilter.value;
        currentFilterQuartile = quartileFilter.value;

        d3.selectAll('#scatter-plot circle')
            .transition()
            .duration(400)
            .attr('fill-opacity', function (d) {
                const stateMatch = currentFilterState === 'all' || d.State === currentFilterState;
                const quartileMatch = currentFilterQuartile === 'all' || d['Income Quartile'] === currentFilterQuartile;
                return stateMatch && quartileMatch ? 0.8 : 0.03;
            })
            .attr('stroke-opacity', function (d) {
                const stateMatch = currentFilterState === 'all' || d.State === currentFilterState;
                const quartileMatch = currentFilterQuartile === 'all' || d['Income Quartile'] === currentFilterQuartile;
                return stateMatch && quartileMatch ? 1 : 0.03;
            })
            .style('pointer-events', function (d) {
                const stateMatch = currentFilterState === 'all' || d.State === currentFilterState;
                const quartileMatch = currentFilterQuartile === 'all' || d['Income Quartile'] === currentFilterQuartile;
                return stateMatch && quartileMatch ? 'all' : 'none';
            });
    };

    stateFilter.addEventListener('change', applyFilters);
    quartileFilter.addEventListener('change', applyFilters);
}

/**
 * Tooltip Utilities
 */
function showTooltip(event, d) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    const childPov = d['Children in Poverty %'] || 0;
    tooltip.innerHTML = `
        <div class="tooltip-title">${d.Location || d.County + ', ' + d.State}</div>
        <div class="tooltip-row">
            <span class="tooltip-label">Death Rate (YPLL):</span>
            <span class="tooltip-value">${Math.round(d['Premature Death Rate (YPLL)']).toLocaleString()}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Median Income:</span>
            <span class="tooltip-value">$${Math.round(d['Median Household Income']).toLocaleString()}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Population:</span>
            <span class="tooltip-value">${Math.round(d.Population).toLocaleString()}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Income Quartile:</span>
            <span class="tooltip-value" style="color: ${quartileColors[d['Income Quartile']] || '#fff'}">${d['Income Quartile']}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Child Poverty:</span>
            <span class="tooltip-value">${(childPov * 100).toFixed(1)}%</span>
        </div>
    `;

    tooltip.classList.add('visible');
    moveTooltip(event);
}

function moveTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    const padding = 15;
    let x = event.clientX + padding;
    let y = event.clientY + padding;

    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = event.clientX - rect.width - padding;
    if (y + rect.height > window.innerHeight) y = event.clientY - rect.height - padding;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.classList.remove('visible');
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        initScatterPlot();
    }, 250);
});

/**
 * County Search Feature
 */
function setupCountySearch() {
    const searchInput = document.getElementById('county-search');
    const searchResults = document.getElementById('search-results');
    const countyDetail = document.getElementById('county-detail');

    if (!searchInput || !searchResults) return;

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            const matches = countyData
                .filter(d => {
                    const name = (d.County + ', ' + d.State).toLowerCase();
                    return name.includes(query);
                })
                .slice(0, 10);

            if (matches.length > 0) {
                searchResults.innerHTML = matches.map(d => `
                    <div class="search-result-item" data-county="${d.County}" data-state="${d.State}">
                        <div class="county-name">${d.County}, ${d.State}</div>
                        <div class="county-meta">Income: $${Math.round(d['Median Household Income']).toLocaleString()} | Death Rate: ${Math.round(d['Premature Death Rate (YPLL)']).toLocaleString()}</div>
                    </div>
                `).join('');
                searchResults.classList.add('active');

                // Add click handlers
                searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const county = item.dataset.county;
                        const state = item.dataset.state;
                        selectCounty(county, state);
                        searchResults.classList.remove('active');
                        searchInput.value = county + ', ' + state;
                    });
                });
            } else {
                searchResults.innerHTML = '<div class="search-result-item"><div class="county-name">No counties found</div></div>';
                searchResults.classList.add('active');
            }
        }, 200);
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

function selectCounty(countyName, stateName) {
    const county = countyData.find(d => d.County === countyName && d.State === stateName);
    if (!county) return;

    const detail = document.getElementById('county-detail');
    if (!detail) return;

    document.getElementById('county-name').textContent = county.County + ', ' + county.State;
    document.getElementById('county-income').textContent = '$' + Math.round(county['Median Household Income']).toLocaleString();
    document.getElementById('county-death').textContent = Math.round(county['Premature Death Rate (YPLL)']).toLocaleString();
    document.getElementById('county-quartile').textContent = county['Income Quartile'];
    document.getElementById('county-childpov').textContent = ((county['Children in Poverty %'] || 0) * 100).toFixed(1) + '%';

    // Color the quartile
    const quartileEl = document.getElementById('county-quartile');
    quartileEl.style.color = quartileColors[county['Income Quartile']] || '#fff';

    detail.classList.remove('hidden');

    // Highlight in scatter plot
    highlightCountyInScatter(countyName, stateName);
}

function highlightCountyInScatter(countyName, stateName) {
    // Reset all circles
    d3.selectAll('#scatter-plot circle')
        .transition()
        .duration(300)
        .attr('fill-opacity', 0.2)
        .attr('stroke-opacity', 0.2);

    // Highlight the selected county
    d3.selectAll('#scatter-plot circle')
        .filter(d => d.County === countyName && d.State === stateName)
        .transition()
        .duration(300)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 3)
        .attr('r', function (d) {
            return Math.max(8, parseFloat(d3.select(this).attr('r')) * 1.5);
        });
}
