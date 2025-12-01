import { useEffect, useState } from 'react';
import { supabase, Transaction, User } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, Clock, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { isOfficer } = useAuth();
  const [transactions, setTransactions] = useState<(Transaction & { creator: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    pendingCount: 0,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const { data: transactionData } = await supabase
      .from('transactions')
      .select('*, creator:users!created_by(*)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionData) {
      setTransactions(transactionData as any);

      const totalIncome = transactionData
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpense = transactionData
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      const totalBalance = totalIncome - totalExpense;

      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalBalance,
        totalIncome,
        totalExpense,
        pendingCount: count || 0,
      });
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Organization Dashboard</h2>
        {isOfficer && (
          <button
            onClick={() => onNavigate('transactions')}
            className="bg-maroon-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-maroon-700 transition flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Transaction</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-maroon-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-maroon-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Balance</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No approved transactions yet</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{transaction.title}</h4>
                      <span className="px-2 py-1 bg-maroon-50 text-maroon-700 text-xs font-medium rounded">
                        {transaction.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{transaction.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDate(transaction.date)}</span>
                      <span>By {transaction.creator?.full_name}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p
                      className={`text-xl font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="mt-1 flex items-center justify-end space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">Approved</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {transactions.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => onNavigate('transactions')}
              className="text-maroon-600 hover:text-maroon-700 font-medium text-sm"
            >
              View all transactions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
