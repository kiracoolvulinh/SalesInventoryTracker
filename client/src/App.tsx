import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import CategoryPage from "@/pages/categories/category-page";
import ProductsPage from "@/pages/categories/products-page";
import SuppliersPage from "@/pages/categories/suppliers-page";
import CustomersPage from "@/pages/categories/customers-page";
import PurchaseOrdersPage from "@/pages/transactions/purchase-orders-page";
import SalesOrdersPage from "@/pages/transactions/sales-orders-page";
import InventoryPage from "@/pages/utilities/inventory-page";
import PriceAdjustmentPage from "@/pages/utilities/price-adjustment-page";
import AccountsPage from "@/pages/settings/accounts-page";
import PermissionsPage from "@/pages/settings/permissions-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <Route path="/">
        <Layout>
          <ProtectedRoute path="/" component={HomePage} />
        </Layout>
      </Route>
      
      {/* Category Routes */}
      <Route path="/categories/product-categories">
        <Layout>
          <ProtectedRoute path="/categories/product-categories" component={CategoryPage} />
        </Layout>
      </Route>
      
      <Route path="/categories/products">
        <Layout>
          <ProtectedRoute path="/categories/products" component={ProductsPage} />
        </Layout>
      </Route>
      
      <Route path="/categories/suppliers">
        <Layout>
          <ProtectedRoute path="/categories/suppliers" component={SuppliersPage} />
        </Layout>
      </Route>
      
      <Route path="/categories/customers">
        <Layout>
          <ProtectedRoute path="/categories/customers" component={CustomersPage} />
        </Layout>
      </Route>
      
      {/* Transaction Routes */}
      <Route path="/transactions/purchase-orders">
        <Layout>
          <ProtectedRoute path="/transactions/purchase-orders" component={PurchaseOrdersPage} />
        </Layout>
      </Route>
      
      <Route path="/transactions/sales-orders">
        <Layout>
          <ProtectedRoute path="/transactions/sales-orders" component={SalesOrdersPage} />
        </Layout>
      </Route>
      
      {/* Utility Routes */}
      <Route path="/utilities/inventory">
        <Layout>
          <ProtectedRoute path="/utilities/inventory" component={InventoryPage} />
        </Layout>
      </Route>
      
      <Route path="/utilities/price-adjustment">
        <Layout>
          <ProtectedRoute path="/utilities/price-adjustment" component={PriceAdjustmentPage} />
        </Layout>
      </Route>
      
      {/* Settings Routes */}
      <Route path="/settings/accounts">
        <Layout>
          <ProtectedRoute path="/settings/accounts" component={AccountsPage} />
        </Layout>
      </Route>
      
      <Route path="/settings/permissions">
        <Layout>
          <ProtectedRoute path="/settings/permissions" component={PermissionsPage} />
        </Layout>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
