import { AnimatePresence, motion } from "framer-motion";
import { StoreProvider } from "@/context/StoreContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { RouterProvider, useRouter } from "@/context/RouterContext";
import { Nav } from "@/components/Nav";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { Home } from "@/components/pages/Home";
import { Shop } from "@/components/pages/Shop";
import { ProductDetail } from "@/components/pages/ProductDetail";
import { Cart } from "@/components/pages/Cart";
import { Checkout } from "@/components/pages/Checkout";
import { OrderSuccess } from "@/components/pages/OrderSuccess";
import { About } from "@/components/pages/About";
import { Contact } from "@/components/pages/Contact";
import { Account } from "@/components/pages/Account";
import { Admin } from "@/components/pages/Admin";
import { InfoPage } from "@/components/pages/InfoPage";
import { useProducts } from "@/context/ProductsContext";

function Pages() {
  const { page } = useRouter();

  const content = (() => {
    switch (page) {
      case "home":
        return <Home />;
      case "wishlist":
      case "shop":
        return <Shop />;
      case "product":
        return <ProductDetail />;
      case "cart":
        return <Cart />;
      case "checkout":
        return <Checkout />;
      case "success":
        return <OrderSuccess />;
      case "about":
        return <About />;
      case "contact":
        return <Contact />;
      case "faq":
      case "warranty":
      case "returns":
      case "privacy":
      case "terms":
        return <InfoPage kind={page} />;
      case "account":
        return <Account />;
      case "admin":
        return <Admin />;
      default:
        return <Home />;
    }
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

function Chrome() {
  const { page } = useRouter();
  const { error } = useProducts();
  const isAdmin = page === "admin";

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-gold selection:text-[#080808]">
      {!isAdmin && <Nav />}
      {!isAdmin && error && (
        <div className="fixed top-20 inset-x-0 z-40 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-full border border-amber-400/30 bg-[#17130a]/95 px-4 py-2 text-center text-xs text-amber-200 shadow-lg backdrop-blur">
          Live catalogue is temporarily unavailable — showing the offline collection.
        </div>
      )}
      <main className={isAdmin ? "" : "pb-16 lg:pb-0"}>
        <Pages />
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileTabBar />}
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#111114",
            border: "1px solid rgba(212,175,55,0.25)",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <StoreProvider>
          <RouterProvider>
            <Chrome />
          </RouterProvider>
        </StoreProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

export default App;
