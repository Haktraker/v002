"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import ApexCharts to ensure it only runs on the client
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

// ApexCharts requires the window object, so we need to check if we're in the browser
const ApexChart = ({ options, series, type, height, width }: any) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="h-[200px] w-full flex items-center justify-center">Loading chart...</div>

  return (
    <Chart
      options={options}
      series={series}
      type={type}
      height={height}
      width={width}
    />
  )
}

export default ApexChart 