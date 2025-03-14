"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Save,
  Package,
  DollarSign,
  CreditCard,
  Info,
  RefreshCw,
} from "lucide-react";

interface SettingsFormProps {
  updateSettings: (formData: FormData) => Promise<void>;
  itemLimits: {
    default: number;
    premium: number;
  };
  commRates: {
    default: number;
    staff: number;
  };
  rentalFees: {
    weekly: number;
    monthly: number;
    quarterly: number;
  };
}

export function SettingsForm({
  updateSettings,
  itemLimits,
  commRates,
  rentalFees,
}: SettingsFormProps) {
  // State for each setting type
  const [currentItemLimits, setCurrentItemLimits] = useState(itemLimits);
  const [currentCommRates, setCurrentCommRates] = useState(commRates);
  const [currentRentalFees, setCurrentRentalFees] = useState(rentalFees);

  // Update item limits
  const updateItemLimit = (type: "default" | "premium", value: number) => {
    setCurrentItemLimits((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Update commission rates
  const updateCommRate = (type: "default" | "staff", value: number) => {
    setCurrentCommRates((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Update rental fees
  const updateRentalFee = (
    type: "weekly" | "monthly" | "quarterly",
    value: number,
  ) => {
    setCurrentRentalFees((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  return (
    <>
      {/* Inventory Limits Tab */}
      <TabsContent value="cubby_limits" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-pink-600" />
              Inventory Item Limits
            </CardTitle>
            <CardDescription>
              Control how many items sellers can list based on their
              subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-8">
              <input
                type="hidden"
                name="setting_key"
                value="cubby_item_limits"
              />
              <input
                type="hidden"
                name="setting_value"
                id="cubby_limits_json"
                value={JSON.stringify(currentItemLimits)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Standard Plan */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Standard Plan</h3>
                    <Badge variant="outline" className="bg-gray-100">
                      Default
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label
                          htmlFor="default_limit"
                          className="text-sm font-medium flex items-center gap-1"
                        >
                          Item Limit
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  Maximum number of items a seller on the
                                  standard plan can list in their cubby
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <span className="text-sm font-medium">
                          {currentItemLimits.default} items
                        </span>
                      </div>
                      <div className="pt-2">
                        <Input
                          id="default_limit"
                          type="number"
                          min="1"
                          max="100"
                          value={currentItemLimits.default}
                          className="w-full"
                          onChange={(e) => {
                            updateItemLimit(
                              "default",
                              parseInt(e.target.value),
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="default_enabled"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Enable Standard Plan
                      </Label>
                      <Switch id="default_enabled" defaultChecked={true} />
                    </div>
                  </div>
                </div>

                {/* Premium Plan */}
                <div className="space-y-4 p-6 bg-pink-50 rounded-lg border border-pink-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Premium Plan</h3>
                    <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                      Premium
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label
                          htmlFor="premium_limit"
                          className="text-sm font-medium flex items-center gap-1"
                        >
                          Item Limit
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  Maximum number of items a seller on the
                                  premium plan can list in their cubby
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <span className="text-sm font-medium">
                          {currentItemLimits.premium} items
                        </span>
                      </div>
                      <div className="pt-2">
                        <Input
                          id="premium_limit"
                          type="number"
                          min="1"
                          max="100"
                          value={currentItemLimits.premium}
                          className="w-full"
                          onChange={(e) => {
                            updateItemLimit(
                              "premium",
                              parseInt(e.target.value),
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="premium_enabled"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Enable Premium Plan
                      </Label>
                      <Switch id="premium_enabled" defaultChecked={true} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setCurrentItemLimits(itemLimits)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Commission Rates Tab */}
      <TabsContent value="commission_rates" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-pink-600" />
              Commission Rate Structure
            </CardTitle>
            <CardDescription>
              Set commission percentages for different listing types and seller
              tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-8">
              <input
                type="hidden"
                name="setting_key"
                value="commission_rates"
              />
              <input
                type="hidden"
                name="setting_value"
                id="commission_rates_json"
                value={JSON.stringify(currentCommRates)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Self-Listing Commission */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Self-Listing</h3>
                    <Badge variant="outline" className="bg-gray-100">
                      Seller Managed
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label
                          htmlFor="default_commission"
                          className="text-sm font-medium flex items-center gap-1"
                        >
                          Commission Rate
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  Percentage of sales taken as commission when
                                  sellers manage their own listings
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <span className="text-sm font-medium">
                          {(currentCommRates.default * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="pt-2">
                        <Slider
                          value={[currentCommRates.default * 100]}
                          max={50}
                          step={1}
                          className="w-full"
                          onValueChange={(value) => {
                            updateCommRate("default", value[0] / 100);
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff-Managed Commission */}
                <div className="space-y-4 p-6 bg-pink-50 rounded-lg border border-pink-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Staff-Managed</h3>
                    <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                      Shop Managed
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label
                          htmlFor="staff_commission"
                          className="text-sm font-medium flex items-center gap-1"
                        >
                          Commission Rate
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  Percentage of sales taken as commission when
                                  shop staff manage the listings
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <span className="text-sm font-medium">
                          {(currentCommRates.staff * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="pt-2">
                        <Slider
                          value={[currentCommRates.staff * 100]}
                          max={50}
                          step={1}
                          className="w-full"
                          onValueChange={(value) => {
                            updateCommRate("staff", value[0] / 100);
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setCurrentCommRates(commRates)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Rental Fees Tab */}
      <TabsContent value="rental_fees" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-pink-600" />
              Cubby Rental Pricing
            </CardTitle>
            <CardDescription>
              Set pricing for different rental periods and cubby types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-8">
              <input
                type="hidden"
                name="setting_key"
                value="cubby_rental_fees"
              />
              <input
                type="hidden"
                name="setting_value"
                id="rental_fees_json"
                value={JSON.stringify(currentRentalFees)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weekly Rental */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Weekly</h3>
                    <Badge variant="outline" className="bg-gray-100">
                      7 Days
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label
                        htmlFor="weekly_fee"
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        Rental Fee
                      </Label>
                      <span className="text-sm font-medium">
                        ${currentRentalFees.weekly}
                      </span>
                    </div>
                    <div className="pt-2 flex items-center">
                      <span className="text-sm mr-2">$</span>
                      <Input
                        id="weekly_fee"
                        type="number"
                        min="1"
                        max="100"
                        value={currentRentalFees.weekly}
                        className="w-full"
                        onChange={(e) => {
                          updateRentalFee("weekly", parseInt(e.target.value));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Monthly Rental */}
                <div className="space-y-4 p-6 bg-pink-50 rounded-lg border border-pink-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Monthly</h3>
                    <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                      30 Days
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label
                        htmlFor="monthly_fee"
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        Rental Fee
                      </Label>
                      <span className="text-sm font-medium">
                        ${currentRentalFees.monthly}
                      </span>
                    </div>
                    <div className="pt-2 flex items-center">
                      <span className="text-sm mr-2">$</span>
                      <Input
                        id="monthly_fee"
                        type="number"
                        min="1"
                        max="200"
                        value={currentRentalFees.monthly}
                        className="w-full"
                        onChange={(e) => {
                          updateRentalFee("monthly", parseInt(e.target.value));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quarterly Rental */}
                <div className="space-y-4 p-6 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Quarterly</h3>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      90 Days
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label
                        htmlFor="quarterly_fee"
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        Rental Fee
                      </Label>
                      <span className="text-sm font-medium">
                        ${currentRentalFees.quarterly}
                      </span>
                    </div>
                    <div className="pt-2 flex items-center">
                      <span className="text-sm mr-2">$</span>
                      <Input
                        id="quarterly_fee"
                        type="number"
                        min="1"
                        max="500"
                        value={currentRentalFees.quarterly}
                        className="w-full"
                        onChange={(e) => {
                          updateRentalFee(
                            "quarterly",
                            parseInt(e.target.value),
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">
                      Pricing Strategy
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Consider offering discounts for longer rental periods to
                      encourage longer commitments. The current quarterly rate
                      offers a{" "}
                      {(
                        100 -
                        (currentRentalFees.quarterly /
                          (currentRentalFees.monthly * 3)) *
                          100
                      ).toFixed(0)}
                      % discount compared to three monthly rentals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setCurrentRentalFees(rentalFees)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
