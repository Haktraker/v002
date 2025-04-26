import { FrameworkName, FrameworkBuStatus, FrameworkSeverity } from '../api/types';

export const FRAMEWORK_NAMES: FrameworkName[] = ["ISO 27001", "NIST CSF", "PDPL", "CIS Controls"];

export const FRAMEWORK_BU_STATUSES: FrameworkBuStatus[] = ["Compliant", "Non-Compliant"];

export const FRAMEWORK_SEVERITIES: FrameworkSeverity[] = ["Critical", "High", "Medium", "Low"]; 