import { CheckCircle, XCircle } from "lucide-react"

export function FeatureComparison() {
  const features = [
    { name: "Dark Web Monitoring", starter: true, professional: true, enterprise: true },
    { name: "Threat Intelligence", starter: "Basic", professional: "Advanced", enterprise: "Custom" },
    { name: "Brand Protection", starter: false, professional: true, enterprise: true },
    { name: "Attack Surface Management", starter: false, professional: "Basic", enterprise: "Advanced" },
    { name: "Credential Monitoring", starter: true, professional: true, enterprise: true },
    { name: "API Access", starter: false, professional: true, enterprise: true },
    { name: "Custom Integrations", starter: false, professional: true, enterprise: true },
    { name: "Dedicated Account Manager", starter: false, professional: false, enterprise: true },
    { name: "Custom Reporting", starter: false, professional: "Basic", enterprise: "Advanced" },
    { name: "On-premise Deployment", starter: false, professional: false, enterprise: true },
  ]

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <CheckCircle className="h-5 w-5 text-cyber-primary mx-auto" />
    } else if (value === false) {
      return <XCircle className="h-5 w-5 text-foreground/30 mx-auto" />
    } else {
      return (
        <div className="flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-cyber-primary mr-1" />
          <span className="text-sm">{value}</span>
        </div>
      )
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4"></th>
            <th className="p-4">
              <div className="text-center">
                <span className="text-lg font-bold">Starter</span>
              </div>
            </th>
            <th className="p-4 bg-muted/20">
              <div className="text-center">
                <span className="text-lg font-bold">Professional</span>
                <div className="text-xs text-cyber-primary mt-1">Popular</div>
              </div>
            </th>
            <th className="p-4">
              <div className="text-center">
                <span className="text-lg font-bold">Enterprise</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-muted/5" : ""}>
              <td className="p-4 font-medium">{feature.name}</td>
              <td className="p-4 text-center">{renderFeatureValue(feature.starter)}</td>
              <td className="p-4 text-center bg-muted/20">{renderFeatureValue(feature.professional)}</td>
              <td className="p-4 text-center">{renderFeatureValue(feature.enterprise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

