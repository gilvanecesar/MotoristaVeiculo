import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Database,
  Download,
  Edit,
  File,
  Loader2,
  LogOut,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Settings,
  SunMedium,
  Trash,
  Upload,
  User,
  UserPlus,
  X,
  AlertCircle,
  Bell as Notification,
  Building,
  Truck,
  Package,
  PackageCheck,
  Building2
} from "lucide-react";

export const Icons = {
  spinner: Loader2,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronUpDown: ChevronsUpDown,
  arrowUpDown: ArrowUpDown,
  arrowRight: ArrowRight,
  check: Check,
  sun: SunMedium,
  moon: Moon,
  warning: AlertTriangle,
  error: AlertCircle,
  close: X,
  notification: Notification,
  search: Search,
  more: MoreVertical,
  file: File,
  user: User,
  logout: LogOut,
  // Additional icons for admin tables
  plus: Plus,
  edit: Edit,
  trash: Trash,
  settings: Settings,
  database: Database,
  userPlus: UserPlus,
  download: Download,
  upload: Upload,
  // Auth icons
  package: Package,
  truck: Truck,
  building: Building,
  activity: Activity,
  google: function GoogleIcon() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-packages">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
        <path d="M12 8.4 V 15.6" />
        <path d="M8.4 12 H 15.6" />
      </svg>
    )
  }
};