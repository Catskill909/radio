'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'

interface DataPoint {
    date: string
    dateObj: Date
    plays: number
    downloads: number
}

interface EngagementLineChartProps {
    data: DataPoint[]
    isLoading: boolean
}

export default function EngagementLineChart({ data, isLoading }: EngagementLineChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

    // Chart dimensions - using viewBox for responsive scaling
    const width = 1000  // Increased for better resolution
    const height = 280  // Increased height for more visual impact
    const padding = { top: 20, right: 30, bottom: 40, left: 50 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Calculate scales with adaptive Y-axis
    const { maxValue, yScale, xScale, yTicks, points } = useMemo(() => {
        if (!data.length) {
            return { maxValue: 10, yScale: () => 0, xScale: () => 0, yTicks: [], points: [] }
        }

        const allValues = data.flatMap(d => [d.plays, d.downloads])
        const max = Math.max(...allValues, 1)

        // Adaptive rounding for nice Y-axis numbers
        // For small numbers (< 10): round to 5s
        // For medium (10-100): round to 10s
        // For larger (100-1000): round to 50s or 100s
        // For very large (1000+): round to 500s or 1000s
        let niceMax: number
        if (max <= 5) {
            niceMax = 5
        } else if (max <= 10) {
            niceMax = 10
        } else if (max <= 50) {
            niceMax = Math.ceil(max / 10) * 10
        } else if (max <= 100) {
            niceMax = Math.ceil(max / 20) * 20
        } else if (max <= 500) {
            niceMax = Math.ceil(max / 50) * 50
        } else if (max <= 1000) {
            niceMax = Math.ceil(max / 100) * 100
        } else {
            niceMax = Math.ceil(max / 500) * 500
        }

        const yScale = (value: number) => {
            return chartHeight - (value / niceMax) * chartHeight + padding.top
        }

        const xScale = (index: number) => {
            return (index / (data.length - 1 || 1)) * chartWidth + padding.left
        }

        // Generate Y-axis ticks (5-6 ticks typically)
        const tickCount = niceMax <= 10 ? niceMax : 5
        const yTicks = Array.from({ length: tickCount + 1 }, (_, i) =>
            Math.round((niceMax / tickCount) * i)
        )

        // Calculate points for both lines
        const points = data.map((d, i) => ({
            x: xScale(i),
            playsY: yScale(d.plays),
            downloadsY: yScale(d.downloads),
            data: d,
            index: i
        }))

        return { maxValue: niceMax, yScale, xScale, yTicks, points }
    }, [data, chartWidth, chartHeight, padding.top, padding.left])

    // Generate smooth curve path
    const generatePath = (pts: typeof points, yKey: 'playsY' | 'downloadsY') => {
        if (pts.length === 0) return ''
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0][yKey]}`

        let path = `M ${pts[0].x} ${pts[0][yKey]}`

        for (let i = 0; i < pts.length - 1; i++) {
            const current = pts[i]
            const next = pts[i + 1]
            const controlX = (current.x + next.x) / 2

            path += ` C ${controlX} ${current[yKey]}, ${controlX} ${next[yKey]}, ${next.x} ${next[yKey]}`
        }

        return path
    }

    // Generate fill path (closed shape for gradient fill)
    const generateFillPath = (pts: typeof points, yKey: 'playsY' | 'downloadsY') => {
        if (pts.length === 0) return ''

        const linePath = generatePath(pts, yKey)
        const baseline = chartHeight + padding.top

        return `${linePath} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`
    }

    const handleMouseMove = (e: React.MouseEvent<SVGElement>, index: number) => {
        const rect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect()
        if (!rect) return
        setTooltipPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
        setHoveredIndex(index)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[320px]">
                <div className="w-6 h-6 border-2 border-gray-600 border-t-green-400 rounded-full animate-spin" />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[320px] text-gray-500">
                No play data yet. Start playing episodes from the listen page!
            </div>
        )
    }

    // Determine which date labels to show
    const labelInterval = data.length <= 7 ? 1 : data.length <= 14 ? 2 : data.length <= 30 ? 4 : 7

    return (
        <div className="relative">
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-green-400 bg-green-400/20" />
                    <span className="text-sm text-gray-400">Plays</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-400/20" />
                    <span className="text-sm text-gray-400">Downloads</span>
                </div>
            </div>

            {/* Chart */}
            <svg
                width="100%"
                height={height + 20}
                viewBox={`0 0 ${width} ${height + 20}`}
                className="overflow-visible"
            >
                <defs>
                    {/* Play gradient fill */}
                    <linearGradient id="playsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(74, 222, 128)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(74, 222, 128)" stopOpacity="0" />
                    </linearGradient>
                    {/* Downloads gradient fill */}
                    <linearGradient id="downloadsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(96, 165, 250)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="rgb(96, 165, 250)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid lines and labels */}
                {yTicks.map((tick, i) => (
                    <g key={i}>
                        <line
                            x1={padding.left}
                            y1={yScale(tick)}
                            x2={width - padding.right}
                            y2={yScale(tick)}
                            stroke="rgb(55, 65, 81)"
                            strokeWidth="1"
                            strokeDasharray={tick === 0 ? "0" : "4 4"}
                        />
                        <text
                            x={padding.left - 10}
                            y={yScale(tick) + 4}
                            textAnchor="end"
                            className="text-xs fill-gray-500"
                        >
                            {tick}
                        </text>
                    </g>
                ))}

                {/* Fill areas */}
                <path
                    d={generateFillPath(points, 'playsY')}
                    fill="url(#playsFill)"
                />
                <path
                    d={generateFillPath(points, 'downloadsY')}
                    fill="url(#downloadsFill)"
                />

                {/* Downloads line (behind plays) */}
                <path
                    d={generatePath(points, 'downloadsY')}
                    fill="none"
                    stroke="rgb(96, 165, 250)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Plays line (on top) */}
                <path
                    d={generatePath(points, 'playsY')}
                    fill="none"
                    stroke="rgb(74, 222, 128)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points - Downloads */}
                {points.map((point, i) => (
                    <circle
                        key={`downloads-${i}`}
                        cx={point.x}
                        cy={point.downloadsY}
                        r={hoveredIndex === i ? 6 : 4}
                        fill="rgb(30, 41, 59)"
                        stroke="rgb(96, 165, 250)"
                        strokeWidth="2"
                        className="transition-all duration-150"
                    />
                ))}

                {/* Data points - Plays */}
                {points.map((point, i) => (
                    <circle
                        key={`plays-${i}`}
                        cx={point.x}
                        cy={point.playsY}
                        r={hoveredIndex === i ? 6 : 4}
                        fill="rgb(30, 41, 59)"
                        stroke="rgb(74, 222, 128)"
                        strokeWidth="2"
                        className="transition-all duration-150"
                    />
                ))}

                {/* Invisible hover targets */}
                {points.map((point, i) => (
                    <rect
                        key={`hover-${i}`}
                        x={point.x - (chartWidth / data.length) / 2}
                        y={padding.top}
                        width={chartWidth / data.length}
                        height={chartHeight}
                        fill="transparent"
                        onMouseEnter={(e) => handleMouseMove(e, i)}
                        onMouseMove={(e) => handleMouseMove(e, i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                    />
                ))}

                {/* X-axis date labels */}
                {points.map((point, i) => (
                    i % labelInterval === 0 || i === points.length - 1 ? (
                        <text
                            key={`label-${i}`}
                            x={point.x}
                            y={height + 15}
                            textAnchor="middle"
                            className="text-[10px] fill-gray-500"
                        >
                            {format(point.data.dateObj, 'MMM d')}
                        </text>
                    ) : null
                ))}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && points[hoveredIndex] && (
                <div
                    className="absolute pointer-events-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl z-50"
                    style={{
                        left: Math.min(tooltipPosition.x + 10, width - 120),
                        top: tooltipPosition.y - 70,
                    }}
                >
                    <div className="text-sm font-medium text-white mb-1">
                        {format(points[hoveredIndex].data.dateObj, 'MMM d')}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-gray-400">Plays:</span>
                        <span className="text-green-400 font-medium">{points[hoveredIndex].data.plays}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-gray-400">Downloads:</span>
                        <span className="text-blue-400 font-medium">{points[hoveredIndex].data.downloads}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
