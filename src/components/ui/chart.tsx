"use client"

import * as React from "preact/compat"
import type { JSX } from "preact"
import * as RechartsPrimitive from "recharts"

import { cn } from "../../lib/utils"

/* ---------------------------------- */
/* THEMES */
/* ---------------------------------- */

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType<any>
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

/* ---------------------------------- */
/* CONTEXT */
/* ---------------------------------- */

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart must be used within <ChartContainer />")
  return ctx
}

/* ---------------------------------- */
/* CONTAINER */
/* ---------------------------------- */

type ChartContainerProps = JSX.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
  children: any
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  function ChartContainer({ id, className, children, config, ...props }, ref) {
    const uniqueId = React.useId()
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`
    return (
    <ChartContext.Provider value={{ config }}>
    <div
      ref={ref}
      data-chart={chartId} // Ensure this matches exactly
      className={cn(
        "flex aspect-video justify-center text-xs",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)

ChartContainer.displayName = "Chart"

/* ---------------------------------- */
/* STYLE */
/* ---------------------------------- */

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, v]) => v.color || v.theme
  )

  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart="${id}"] {
${colorConfig
  .map(([key, cfg]) => {
    const color = cfg.theme?.[theme as keyof typeof THEMES] || cfg.color
    return color ? `--color-${key}: ${color};` : ""
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

/* ---------------------------------- */
/* TOOLTIP */
/* ---------------------------------- */

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipProps = JSX.HTMLAttributes<HTMLDivElement> & {
  active?: boolean
  payload?: any[]
  label?: any
  formatter?: any
  labelFormatter?: any
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "dot" | "line" | "dashed"
  nameKey?: string
  labelKey?: string
  color?: string
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipProps
>(function ChartTooltipContent(
  {
    active,
    payload,
    className,
    hideIndicator,
    color,
    nameKey,
  },
  ref
) {
  const { config } = useChart()

  if (!active || !payload?.length) return null

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 text-xs shadow",
        className
      )}
    >
      {payload.map((item, i) => {
        const key = `${nameKey || item.name || item.dataKey || "value"}`
        const cfg = getPayloadConfigFromPayload(config, item, key)
        const indicatorColor = color || item.color

        return (
          <div key={i} className="flex items-center gap-2">
            {!hideIndicator && (
              <div
                className="h-2 w-2 rounded"
                style={{ backgroundColor: indicatorColor }}
              />
            )}
            <span>{cfg?.label || item.name}</span>
            <span className="ml-auto font-mono">
              {item.value?.toLocaleString?.()}
            </span>
          </div>
        )
      })}
    </div>
  )
})

ChartTooltipContent.displayName = "ChartTooltip"

/* ---------------------------------- */
/* LEGEND */
/* ---------------------------------- */

const ChartLegend = RechartsPrimitive.Legend

type LegendProps = JSX.HTMLAttributes<HTMLDivElement> & {
  payload?: any[]
  verticalAlign?: "top" | "bottom"
  hideIcon?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, LegendProps>(
  function ChartLegendContent(
    { className, payload, verticalAlign = "bottom", hideIcon, nameKey },
    ref
  ) {
    const { config } = useChart()

    if (!payload?.length) return null

    return (
      <div
        ref={ref}
        className={cn(
          "flex justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item, i) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const cfg = getPayloadConfigFromPayload(config, item, key)

          return (
            <div key={i} className="flex items-center gap-1.5">
              {cfg?.icon && !hideIcon ? (
                <cfg.icon />
              ) : (
                <div
                  className="h-2 w-2 rounded"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {cfg?.label}
            </div>
          )
        })}
      </div>
    )
  }
)

ChartLegendContent.displayName = "ChartLegend"

/* ---------------------------------- */
/* HELPERS */
/* ---------------------------------- */

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: any,
  key: string
) {
  const resolvedKey =
    payload?.payload?.[key] ||
    payload?.[key] ||
    payload?.name ||
    key

  return config[resolvedKey] || config[key]
}

/* ---------------------------------- */
/* EXPORTS */
/* ---------------------------------- */

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
