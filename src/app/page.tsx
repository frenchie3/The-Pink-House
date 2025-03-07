import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  BarChart3,
  BoxIcon,
  QrCode,
  Search,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { createClient } from "../../supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                Streamlined Inventory Management for Charity Shops
              </h1>
              <p className="text-lg text-gray-700 mb-8 max-w-lg mx-auto md:mx-0">
                A modern, intuitive system designed to help charity shops track
                inventory, manage donations, and process sales with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-lg font-medium"
                >
                  Go to Dashboard
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative rounded-lg shadow-xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80"
                  alt="Inventory Dashboard"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Powerful Inventory Management Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our system is designed specifically for charity shops with
              features that streamline operations and improve efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-6 h-6" />,
                title: "Smart Search & Filters",
                description:
                  "Quickly find items by SKU, category, or location with advanced filtering options",
              },
              {
                icon: <QrCode className="w-6 h-6" />,
                title: "Barcode Scanning",
                description:
                  "Scan barcodes with your device camera for instant item lookup and processing",
              },
              {
                icon: <BoxIcon className="w-6 h-6" />,
                title: "Stock Management",
                description:
                  "Track inventory levels with real-time updates and low stock alerts",
              },
              {
                icon: <Tag className="w-6 h-6" />,
                title: "Seller Management",
                description:
                  "Easily manage seller accounts, products, and commission rates",
              },
              {
                icon: <ShoppingBag className="w-6 h-6" />,
                title: "Sales Tracking",
                description:
                  "Process sales and track performance with detailed reporting",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics Dashboard",
                description:
                  "Visualize your shop's performance with intuitive charts and metrics",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-teal-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-teal-100">Charity Shops</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-teal-100">Items Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30%</div>
              <div className="text-teal-100">Efficiency Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Streamline Your Inventory?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of charity shops already using our platform to manage
            their inventory more efficiently.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Access Dashboard
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
