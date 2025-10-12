import React, { useState, useEffect, useMemo } from "react";
import { InventoryItem, ItemStatus } from "../types";
import {
  generateDescription,
  suggestCategory,
} from "../services/geminiService";
import { SparklesIcon } from "./icons/SparklesIcon";
import { CameraIcon } from "./icons/CameraIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  itemToEdit?: InventoryItem;
  inventory: InventoryItem[];
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  inventory,
}) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [container, setContainer] = useState("");
  const [compartment, setCompartment] = useState("");
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.HAVE);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  // Enhanced tracking fields
  const [serialNumber, setSerialNumber] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [currency, setCurrency] = useState("ZAR");
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [condition, setCondition] = useState<
    "New" | "Used" | "Refurbished" | "Damaged" | "Unknown"
  >("New");
  const [notes, setNotes] = useState("");

  const uniqueContainers = useMemo(() => {
    const containers = new Set<string>();
    inventory.forEach((item) => {
      const [containerName] = item.location.split(" - ");
      if (containerName) containers.add(containerName.trim());
    });
    return Array.from(containers);
  }, [inventory]);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setQuantity(itemToEdit.quantity);
      const [cont, comp = ""] = itemToEdit.location
        .split(" - ")
        .map((s) => s.trim());
      setContainer(cont || "");
      setCompartment(comp || "");
      setStatus(itemToEdit.status);
      setCategory(itemToEdit.category || "");
      setDescription(itemToEdit.description || "");
      setSource(itemToEdit.source || "");
      setImageUrl(itemToEdit.imageUrl);

      // Enhanced tracking fields
      setSerialNumber(itemToEdit.serialNumber || "");
      setModelNumber(itemToEdit.modelNumber || "");
      setManufacturer(itemToEdit.manufacturer || "");
      setPurchaseDate(itemToEdit.purchaseDate || "");
      setReceivedDate(itemToEdit.receivedDate || "");
      setPurchasePrice(itemToEdit.purchasePrice || "");
      setCurrency(itemToEdit.currency || "ZAR");
      setSupplier(itemToEdit.supplier || "");
      setInvoiceNumber(itemToEdit.invoiceNumber || "");
      setWarrantyExpiry(itemToEdit.warrantyExpiry || "");
      setCondition(itemToEdit.condition || "New");
      setNotes(itemToEdit.notes || "");
    } else {
      // Reset form
      setName("");
      setQuantity(1);
      setContainer("");
      setCompartment("");
      setStatus(ItemStatus.HAVE);
      setCategory("");
      setDescription("");
      setSource("");
      setImageUrl(undefined);

      // Reset enhanced tracking fields
      setSerialNumber("");
      setModelNumber("");
      setManufacturer("");
      setPurchaseDate("");
      setReceivedDate("");
      setPurchasePrice("");
      setCurrency("ZAR");
      setSupplier("");
      setInvoiceNumber("");
      setWarrantyExpiry("");
      setCondition("New");
      setNotes("");
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const location = compartment
      ? `${container.trim()} - ${compartment.trim()}`
      : container.trim();
    onSave({
      id: itemToEdit?.id || "",
      name,
      quantity,
      location,
      status,
      category,
      description,
      source,
      imageUrl,
      createdAt: itemToEdit?.createdAt || new Date().toISOString(),

      // Enhanced tracking fields
      serialNumber: serialNumber || undefined,
      modelNumber: modelNumber || undefined,
      manufacturer: manufacturer || undefined,
      purchaseDate: purchaseDate || undefined,
      receivedDate: receivedDate || undefined,
      purchasePrice:
        typeof purchasePrice === "number" ? purchasePrice : undefined,
      currency: currency || undefined,
      supplier: supplier || undefined,
      invoiceNumber: invoiceNumber || undefined,
      warrantyExpiry: warrantyExpiry || undefined,
      condition: condition,
      notes: notes || undefined,
    });
    onClose();
  };

  const handleGenerateDescription = async () => {
    if (!name) {
      alert("Please enter an item name first.");
      return;
    }
    setIsGenerating(true);
    try {
      const generatedDesc = await generateDescription(name);
      setDescription(generatedDesc);
    } catch (error) {
      console.error("Failed to generate description:", error);
      alert("Sorry, there was an error generating the description.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestCategory = async () => {
    if (!name) {
      alert("Please enter an item name first.");
      return;
    }
    setIsSuggestingCategory(true);
    try {
      const suggestedCategory = await suggestCategory(name);
      setCategory(suggestedCategory);
    } catch (error) {
      console.error("Failed to suggest category:", error);
      alert("Sorry, there was an error suggesting a category.");
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-2xl border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border-color">
            <h3 className="text-lg font-medium leading-6 text-text-primary">
              {itemToEdit ? "Edit Item" : "Add New Item"}
            </h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close modal">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-secondary">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-text-secondary">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="0"
                  required
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-text-secondary">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ItemStatus)}
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm">
                  {Object.values(ItemStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-text-secondary">
                  Category
                </label>
                <button
                  type="button"
                  onClick={handleSuggestCategory}
                  disabled={isSuggestingCategory || !name}
                  className="text-xs text-accent hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSuggestingCategory ? (
                    <>
                      <SpinnerIcon />{" "}
                      <span className="ml-1">Suggesting...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon />{" "}
                      <span className="ml-1">Suggest with AI</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Sensor"
                className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="container"
                  className="block text-sm font-medium text-text-secondary">
                  Storage Container
                </label>
                <input
                  type="text"
                  id="container"
                  value={container}
                  onChange={(e) => setContainer(e.target.value)}
                  required
                  list="containers-list"
                  placeholder="e.g. Component Box A"
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
                <datalist id="containers-list">
                  {uniqueContainers.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label
                  htmlFor="compartment"
                  className="block text-sm font-medium text-text-secondary">
                  Compartment / Slot
                </label>
                <input
                  type="text"
                  id="compartment"
                  value={compartment}
                  onChange={(e) => setCompartment(e.target.value)}
                  placeholder="e.g. B2"
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="source"
                className="block text-sm font-medium text-text-secondary">
                Source / Origin
              </label>
              <input
                type="text"
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Adafruit, Salvaged"
                className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-text-secondary">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !name}
                  className="text-xs text-accent hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {isGenerating ? (
                    <>
                      <SpinnerIcon />{" "}
                      <span className="ml-1">Generating...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon />{" "}
                      <span className="ml-1">Generate with AI</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Item Image
              </label>
              <div className="flex items-center space-x-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover border border-border-color"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-primary border border-border-color flex items-center justify-center">
                    <CameraIcon className="h-8 w-8 text-text-secondary" />
                  </div>
                )}
                <label className="cursor-pointer bg-primary border border-border-color py-2 px-3 rounded-md text-sm font-medium text-text-primary hover:bg-secondary transition-colors">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Enhanced Tracking Fields */}
            <div className="border-t border-border-color pt-4">
              <h4 className="text-sm font-medium text-text-primary mb-3">
                Enhanced Tracking (Optional)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="serialNumber"
                    className="block text-sm font-medium text-text-secondary">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    id="serialNumber"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. ABC123456"
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="modelNumber"
                    className="block text-sm font-medium text-text-secondary">
                    Model Number
                  </label>
                  <input
                    type="text"
                    id="modelNumber"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="e.g. ESP32-WROOM-32"
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="manufacturer"
                    className="block text-sm font-medium text-text-secondary">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. Arduino, Adafruit"
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="condition"
                    className="block text-sm font-medium text-text-secondary">
                    Condition
                  </label>
                  <select
                    id="condition"
                    value={condition}
                    onChange={(e) =>
                      setCondition(
                        e.target.value as
                          | "New"
                          | "Used"
                          | "Refurbished"
                          | "Damaged"
                          | "Unknown"
                      )
                    }
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm">
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="purchaseDate"
                    className="block text-sm font-medium text-text-secondary">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="receivedDate"
                    className="block text-sm font-medium text-text-secondary">
                    Received Date
                  </label>
                  <input
                    type="date"
                    id="receivedDate"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="col-span-2">
                  <label
                    htmlFor="purchasePrice"
                    className="block text-sm font-medium text-text-secondary">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    id="purchasePrice"
                    value={purchasePrice}
                    onChange={(e) =>
                      setPurchasePrice(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium text-text-secondary">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="HKD">HKD - Hong Kong Dollar</option>
                    <option value="NZD">NZD - New Zealand Dollar</option>
                    <option value="SEK">SEK - Swedish Krona</option>
                    <option value="NOK">NOK - Norwegian Krone</option>
                    <option value="DKK">DKK - Danish Krone</option>
                    <option value="PLN">PLN - Polish Zloty</option>
                    <option value="CZK">CZK - Czech Koruna</option>
                    <option value="HUF">HUF - Hungarian Forint</option>
                    <option value="RUB">RUB - Russian Ruble</option>
                    <option value="BRL">BRL - Brazilian Real</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                    <option value="ARS">ARS - Argentine Peso</option>
                    <option value="CLP">CLP - Chilean Peso</option>
                    <option value="COP">COP - Colombian Peso</option>
                    <option value="PEN">PEN - Peruvian Sol</option>
                    <option value="TRY">TRY - Turkish Lira</option>
                    <option value="ILS">ILS - Israeli Shekel</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="QAR">QAR - Qatari Riyal</option>
                    <option value="KWD">KWD - Kuwaiti Dinar</option>
                    <option value="BHD">BHD - Bahraini Dinar</option>
                    <option value="OMR">OMR - Omani Rial</option>
                    <option value="JOD">JOD - Jordanian Dinar</option>
                    <option value="LBP">LBP - Lebanese Pound</option>
                    <option value="EGP">EGP - Egyptian Pound</option>
                    <option value="MAD">MAD - Moroccan Dirham</option>
                    <option value="TND">TND - Tunisian Dinar</option>
                    <option value="DZD">DZD - Algerian Dinar</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="GHS">GHS - Ghanaian Cedi</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="TZS">TZS - Tanzanian Shilling</option>
                    <option value="ETB">ETB - Ethiopian Birr</option>
                    <option value="ZMW">ZMW - Zambian Kwacha</option>
                    <option value="BWP">BWP - Botswana Pula</option>
                    <option value="NAD">NAD - Namibian Dollar</option>
                    <option value="SZL">SZL - Swazi Lilangeni</option>
                    <option value="LSL">LSL - Lesotho Loti</option>
                    <option value="MUR">MUR - Mauritian Rupee</option>
                    <option value="SCR">SCR - Seychellois Rupee</option>
                    <option value="THB">THB - Thai Baht</option>
                    <option value="MYR">MYR - Malaysian Ringgit</option>
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                    <option value="PHP">PHP - Philippine Peso</option>
                    <option value="VND">VND - Vietnamese Dong</option>
                    <option value="LAK">LAK - Lao Kip</option>
                    <option value="KHR">KHR - Cambodian Riel</option>
                    <option value="MMK">MMK - Myanmar Kyat</option>
                    <option value="BDT">BDT - Bangladeshi Taka</option>
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="NPR">NPR - Nepalese Rupee</option>
                    <option value="BTN">BTN - Bhutanese Ngultrum</option>
                    <option value="AFN">AFN - Afghan Afghani</option>
                    <option value="IRR">IRR - Iranian Rial</option>
                    <option value="IQD">IQD - Iraqi Dinar</option>
                    <option value="SYP">SYP - Syrian Pound</option>
                    <option value="YER">YER - Yemeni Rial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="supplier"
                    className="block text-sm font-medium text-text-secondary">
                    Supplier
                  </label>
                  <input
                    type="text"
                    id="supplier"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Amazon, Adafruit, Mouser"
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="invoiceNumber"
                    className="block text-sm font-medium text-text-secondary">
                    Invoice/Order Number
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-123456"
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="warrantyExpiry"
                  className="block text-sm font-medium text-text-secondary">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  id="warrantyExpiry"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-text-secondary">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional notes about this item..."
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-secondary border border-border-color py-2 px-4 rounded-md text-sm font-medium text-text-primary hover:bg-primary transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                className="bg-accent hover:bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AddItemModal;
