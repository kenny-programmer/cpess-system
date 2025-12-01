import { useEffect, useState } from "react";
import {
  supabase,
  Transaction,
  User,
  TransactionRevision,
} from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  History,
  X,
  Upload,
} from "lucide-react";

type TransactionWithCreator = Transaction & { creator: User; approver?: User };

export default function TransactionsPage() {
  const { user, isOfficer } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithCreator[]>(
    []
  );
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionWithCreator[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithCreator | null>(null);
  const [revisions, setRevisions] = useState<
    (TransactionRevision & { reviser: User })[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const categories = [
    "Event",
    "Materials",
    "Fundraising",
    "Supplies",
    "Transportation",
    "Other",
  ];

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: categories[0],
    description: "",
    date: new Date().toISOString().split("T")[0],
    proofImage: null as File | null,
    proofImageUrl: "",
  });

  const [editReason, setEditReason] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const loadTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*, creator:users!created_by(*), approver:users!approved_by(*)")
      .order("created_at", { ascending: false });

    if (data) {
      setTransactions(data as any);
    }
    setLoading(false);
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `transaction-proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("transaction-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("transaction-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // --- STRICT VALIDATION START ---
    if (
      !formData.title ||
      !formData.amount ||
      !formData.date ||
      !formData.description
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (!formData.proofImage) {
      alert("A Proof Image is required to submit a transaction.");
      return;
    }
    // --- STRICT VALIDATION END ---

    try {
      let proofUrl = formData.proofImageUrl;

      if (formData.proofImage) {
        proofUrl = await uploadImage(formData.proofImage);
      }

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          title: formData.title,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          proof_image_url: proofUrl,
          created_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action_type: "created",
        entity_type: "transaction",
        entity_id: data.id,
        user_id: user.id,
        changes: { transaction: data },
      });

      resetForm();
      setShowAddModal(false);
      loadTransactions();
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Failed to create transaction. Check console for details.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTransaction || !editReason.trim()) {
      alert("Please provide a reason for this edit");
      return;
    }

    try {
      let proofUrl = formData.proofImageUrl;

      if (formData.proofImage) {
        proofUrl = await uploadImage(formData.proofImage);
      }

      await supabase.from("transaction_revisions").insert({
        transaction_id: selectedTransaction.id,
        title: selectedTransaction.title,
        amount: selectedTransaction.amount,
        category: selectedTransaction.category,
        description: selectedTransaction.description,
        date: selectedTransaction.date,
        proof_image_url: selectedTransaction.proof_image_url,
        revised_by: user.id,
        revision_reason: editReason,
      });

      const updates = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        proof_image_url: proofUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", selectedTransaction.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action_type: "updated",
        entity_type: "transaction",
        entity_id: selectedTransaction.id,
        user_id: user.id,
        changes: { before: selectedTransaction, after: updates },
        reason: editReason,
      });

      resetForm();
      setShowEditModal(false);
      setEditReason("");
      loadTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction");
    }
  };

  const handleDelete = async (transaction: TransactionWithCreator) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transaction.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action_type: "deleted",
        entity_type: "transaction",
        entity_id: transaction.id,
        user_id: user.id,
        changes: { transaction },
      });

      loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction");
    }
  };

  const handleApprove = async (transaction: TransactionWithCreator) => {
    if (!user) return;

    const isAuthorized =
      user.role === "admin" ||
      [
        "President",
        "VP Internal",
        "VP External",
        "Treasurer",
        "Assistant Treasurer",
        "Auditor",
      ].includes(user.officer_position || "");

    if (!isAuthorized) {
      alert("You do not have permission to approve transactions.");
      return;
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action_type: "approved",
        entity_type: "transaction",
        entity_id: transaction.id,
        user_id: user.id,
        changes: { status: "approved" },
      });

      loadTransactions();
    } catch (error) {
      console.error("Error approving transaction:", error);
      alert("Failed to approve transaction");
    }
  };

  const handleReject = async (transaction: TransactionWithCreator) => {
    if (!user) return;

    const isAuthorized =
      user.role === "admin" ||
      [
        "President",
        "VP Internal",
        "VP External",
        "Treasurer",
        "Assistant Treasurer",
        "Auditor",
      ].includes(user.officer_position || "");

    if (!isAuthorized) {
      alert("You do not have permission to reject transactions.");
      return;
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action_type: "rejected",
        entity_type: "transaction",
        entity_id: transaction.id,
        user_id: user.id,
        changes: { status: "rejected" },
      });

      loadTransactions();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      alert("Failed to reject transaction");
    }
  };

  const viewHistory = async (transaction: TransactionWithCreator) => {
    const { data } = await supabase
      .from("transaction_revisions")
      .select("*, reviser:users!revised_by(*)")
      .eq("transaction_id", transaction.id)
      .order("created_at", { ascending: false });

    if (data) {
      setRevisions(data as any);
    }

    setSelectedTransaction(transaction);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      category: categories[0],
      description: "",
      date: new Date().toISOString().split("T")[0],
      proofImage: null,
      proofImageUrl: "",
    });
  };

  const openEditModal = (transaction: TransactionWithCreator) => {
    setSelectedTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      proofImage: null,
      proofImageUrl: transaction.proof_image_url,
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-maroon-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        {(isOfficer || user?.role === "admin") && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-maroon-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-maroon-700 transition flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Transaction</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {transaction.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.category}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {transaction.creator?.full_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {transaction.status === "pending" && (
                          <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                        {transaction.status === "approved" && (
                          <>
                            <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </span>
                            {transaction.approver && (
                              <span className="text-[10px] text-gray-500 mt-1">
                                by {transaction.approver.full_name}
                              </span>
                            )}
                          </>
                        )}
                        {transaction.status === "rejected" && (
                          <>
                            <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </span>
                            {transaction.approver && (
                              <span className="text-[10px] text-gray-500 mt-1">
                                by {transaction.approver.full_name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowViewModal(true);
                          }}
                          className="p-1 text-maroon-600 hover:bg-maroon-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => viewHistory(transaction)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {(isOfficer || user?.role === "admin") && (
                          <>
                            {transaction.status === "pending" && (
                              <>
                                {transaction.created_by !== user?.id && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(transaction)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      title="Approve"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReject(transaction)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Reject"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => openEditModal(transaction)}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Add Transaction
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (+ income / - expense){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof Image (Required) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proofImage: e.target.files?.[0] || null,
                      })
                    }
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-maroon-50 file:text-maroon-700 hover:file:bg-maroon-100"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-maroon-600 text-white py-2 rounded-lg font-medium hover:bg-maroon-700 transition"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Transaction
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setEditReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  You must provide a reason for editing this transaction. The
                  original version will be preserved in the revision history.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Edit (Required)
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  placeholder="e.g., Correcting amount, Updating description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Proof Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proofImage: e.target.files?.[0] || null,
                      })
                    }
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-maroon-50 file:text-maroon-700 hover:file:bg-maroon-100"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-maroon-600 text-white py-2 rounded-lg font-medium hover:bg-maroon-700 transition"
                >
                  Update Transaction
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setEditReason("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Transaction Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Title</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedTransaction.title}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p
                    className={`text-xl font-bold ${
                      selectedTransaction.amount > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedTransaction.amount > 0 ? "+" : ""}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedTransaction.category}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="text-lg text-gray-900">
                  {formatDate(selectedTransaction.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">
                  {selectedTransaction.description}
                </p>
              </div>
              <img
                src={
                  selectedTransaction.proof_image_url ||
                  "https://placehold.co/600x400?text=No+Proof"
                }
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/600x400?text=Image+Error";
                  e.currentTarget.onerror = null; // prevents infinite loop
                }}
                alt="Proof"
                className="w-full rounded-lg border border-gray-200 object-contain max-h-96 bg-gray-50"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created By</p>
                  <p className="text-gray-900">
                    {selectedTransaction.creator?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  {selectedTransaction.status === "pending" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  )}
                  {selectedTransaction.status === "approved" && (
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </span>
                      {selectedTransaction.approver && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {selectedTransaction.approver.full_name}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedTransaction.status === "rejected" && (
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </span>
                      {selectedTransaction.approver && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {selectedTransaction.approver.full_name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Revision History
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {revisions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No revisions yet
                </p>
              ) : (
                <div className="space-y-4">
                  {revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {revision.reviser.full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(revision.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-maroon-50 text-maroon-700 text-xs font-medium rounded">
                          Revision
                        </span>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Reason:
                        </p>
                        <p className="text-sm text-yellow-900">
                          {revision.revision_reason}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Title</p>
                          <p className="font-medium">{revision.title}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">
                            {formatCurrency(revision.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-medium">{revision.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium">
                            {formatDate(revision.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
