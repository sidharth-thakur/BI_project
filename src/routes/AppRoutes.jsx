import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const ProductsMaster = lazy(() => import("../pages/Products/ProductsMaster"));
const ClientsLeads = lazy(() => import("../pages/Clients/ClientsLeads"));
const CallStatus = lazy(() => import("../pages/call-center/CallCenterCRM"));
const BillManagement = lazy(() => import("../pages/Bills/BillManagement"));
const DataManagement = lazy(
  () => import("../pages/DataManagement/DataManagement")
);
const CloudSync = lazy(() => import("../pages/DataManagement/CloudSync"));
const ImportExport = lazy(
  () => import("../pages/DataManagement/ImportExport")
);
const CSVImport = lazy(() => import("../pages/DataManagement/CSVImport"));
const Quotations = lazy(() => import("../pages/quotations/QuotationsList"));
const CreateQuotation = lazy(() => import("../pages/quotations/CreateQuotation"));
const QuotationPreview = lazy(() => import("../pages/quotations/QuotationPreview"));
const POManagement = lazy(() => import("../pages/po/POManagement"));
const UserManagement = lazy(() => import("../pages/admin/UserManagement"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<ProductsMaster />} />
        <Route path="/clients" element={<ClientsLeads />} />
        <Route path="/follow-ups" element={<CallStatus />} />
        <Route path="/bills" element={<BillManagement />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotations/create" element={<CreateQuotation />} />
        <Route path="/quotations/edit/:number" element={<CreateQuotation />} />
        <Route path="/quotations/view/:number" element={<QuotationPreview />} />
        <Route path="/po-management" element={<POManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/data-management" element={<DataManagement />} />
        <Route path="/data-management/cloud-sync" element={<CloudSync />} />
        <Route path="/data-management/import-export" element={<ImportExport />} />
        <Route path="/data-management/csv-import" element={<CSVImport />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
