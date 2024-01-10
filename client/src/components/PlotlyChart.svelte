<script lang="ts">
const plotlyUrl = 'https://cdn.plot.ly/plotly-2.27.0.min.js'

let { chart_json } = $props<{
    chart_json: string
}>()

function parseChartJson(json: string): object | null {
    try {
        return JSON.parse(json)
    } catch (e) {
        return null
    }
}

async function loadPlotly() {
    return new Promise((resolve, reject) => {
        if (window.Plotly) {
            resolve(window.Plotly)
        } else {
            const script = document.createElement('script')
            script.src = plotlyUrl
            script.onload = () => resolve(window.Plotly)
            document.head.appendChild(script)
        }
    })
}

function configureChartData(data: RecordOf<any> | null): RecordOf<any> | null {
    if (!data) {
        return null
    }
    data.layout = data.layout ?? {}
    data.layout.modebar = data.layout.modebar ?? {}
    data.config = data.config ?? {}

    data.layout.height = 400
    data.layout.plot_bgcolor = 'transparent'
    data.layout.paper_bgcolor = 'transparent'
    data.layout.modebar.color = '$a9a9a9'
    data.layout.modebar.activecolor = '$007bff'
    data.layout.modebar.bgcolor = 'transparent'

    data.config.displaylogo = false
    data.config.modeBarButtonsToRemove = ['zoomIn2d', 'zoomOut2d', 'resetScale2d', 'lasso2d']
    data.config.responsive = true

    return data
}

let Plotly: any = $state(null)
let chartDiv: HTMLDivElement | null = $state(null)
let data: RecordOf<any> | null = $derived(configureChartData(parseChartJson(chart_json)))
let drawnYet = $state(false)

setTimeout(async () => {
    Plotly = await loadPlotly()
})

$effect(() => {
    if (Plotly && chartDiv && data) {
        Plotly.newPlot(chartDiv, data)
        if (!drawnYet) {
            drawnYet = true
        }
    }
})
</script>

<div style:visibility={drawnYet ? '' : 'invisible'}>
    <div bind:this={chartDiv} />
</div>
