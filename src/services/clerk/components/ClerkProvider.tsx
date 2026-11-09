import { ReactNode } from "react"
import { ClerkProvider as OriginalClerkProvider } from "@clerk/nextjs"
import { buttonVariants } from "@/components/ui/button"

export function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <OriginalClerkProvider
      appearance={{
        cssLayerName: "vendor",
        variables: {
          colorBackground: "var(--color-background)",
          borderRadius: "var(--radius-md)",
          colorBorder: "var(--color-border)",
          colorDanger: "var(--color-destructive)",
          colorForeground: "var(--color-foreground)",
          colorPrimary: "var(--color-primary)",
          colorPrimaryForeground: "var(--color-primary-foreground)",
          colorInput: "var(--color-input)",
          colorInputForeground: "var(--color-foreground)",
          colorMuted: "var(--color-muted)",
          colorMutedForeground: "var(--color-muted-foreground)",
          colorNeutral: "var(--color-secondary-foreground)",
          colorRing: "var(--color-ring)",
          colorShadow: "var(--color-shadow-color)",
          colorSuccess: "var(--color-primary-ink)",
          colorWarning: "var(--color-warning)",
          fontFamily: "var(--font-sans)",
          fontFamilyButtons: "var(--font-sans)",
        },
        elements: {
          pricingTableCard:
            "custom-pricing-table bg-card text-card-foreground border border-border rounded-xl p-6 my-3",
          pricingTableCardHeader: "p-0 pb-12",
          pricingTableCardTitle: "text-xl",
          pricingTableCardBody:
            "flex flex-col justify-end [&>.cl-pricingTableCardFeatures]:justify-items-end",
          pricingTableCardDescription: "text-muted-foreground text-sm mb-2",
          pricingTableCardFeeContainer: "items-baseline gap-0.5",
          pricingTableCardFee: "text-4xl",
          pricingTableCardFeePeriodNotice: "hidden",
          pricingTableCardFeePeriod: "text-base text-muted-foreground",
          pricingTableCardFeatures: "p-0 border-none",
          pricingTableCardFeaturesListItem: "[&>svg]:text-primary-ink",
          pricingTableCardFeaturesListItemTitle: "text-sm",
          pricingTableCardFooter: "p-0 pt-8 border-none",
          pricingTableCardFooterButton: buttonVariants(),
        },
      }}
    >
      {children}
    </OriginalClerkProvider>
  )
}
