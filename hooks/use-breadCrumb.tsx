import { usePathname } from "next/navigation";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export function useBreadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.replace(/\/$/, "").split("/").filter(Boolean);
    
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: "Dashboard",
        href: "/dashboard",
      },
    ];

    let currentPath = "";
    paths.forEach((path, index) => {
      if (path === "dashboard") return;

      currentPath += `/${path}`;
      
      // Custom labels for specific paths
      let label = path;
      if (path === "assets") {
        label = "Assets";
      } else if (path === "ips") {
        label = "IPs";
      } else {
        label = path
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      breadcrumbs.push({
        label,
        href: `/dashboard${currentPath}`,
        isActive: index === paths.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const BreadcrumbComponent = () => (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isActive ? (
                <span 
                  className="font-semibold dark:text-white text-black"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <BreadcrumbLink 
                  href={item.href} 
                  className="dark:text-white text-black"
                >
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );

  return {
    breadcrumbs,
    BreadcrumbComponent,
  };
}