import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Loader2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';
import { TransactionRevert } from '../services/transactionRevertService';
import TransactionsRevertDetails from '../components/TransactionsRevertDetails';
import { useTransactionRevertStore } from '../store/transactionRevertStore';
import GlobalSearch from './globalfunctions/GlobalSearch';

const TransactionsRevert: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
    const {
        revertRequests,
        isLoading,
        error,
        fetchRevertRequests,
        fetchUpdates
    } = useTransactionRevertStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const [selectedRevert, setSelectedRevert] = useState<TransactionRevert | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'details'>('list');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [userRoleId, setUserRoleId] = useState<string | number | null>(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && mobileView === 'details') {
                setMobileView('list');
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileView]);

    useEffect(() => {
        const authData = localStorage.getItem('authData');
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                setUserRoleId(parsed.role_id || null);
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        const fetchColorPalette = async () => {
            try {
                const activePalette = await settingsColorPaletteService.getActive();
                setColorPalette(activePalette);
            } catch (err) {
                console.error('Failed to fetch color palette:', err);
            }
        };
        fetchColorPalette();
    }, []);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(localStorage.getItem('theme') !== 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        setIsDarkMode(localStorage.getItem('theme') !== 'light');
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        fetchRevertRequests();
    }, [fetchRevertRequests]);

    // Polling for updates every 3 seconds - Incremental fetch
    useEffect(() => {
        const POLLING_INTERVAL = 3000; // 3 seconds
        const intervalId = setInterval(async () => {
            console.log('[TransactionsRevert Page] Polling for updates...');
            try {
                await fetchUpdates();
            } catch (err) {
                console.error('[TransactionsRevert Page] Polling failed:', err);
            }
        }, POLLING_INTERVAL);

        return () => clearInterval(intervalId);
    }, [fetchUpdates]);

    const handleRowClick = (revert: TransactionRevert) => {
        setSelectedRevert(revert);
        if (window.innerWidth < 768) {
            setMobileView('details');
        }
    };

    const handleMobileBack = () => {
        if (mobileView === 'details') {
            setSelectedRevert(null);
            setMobileView('list');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    const filteredReverts = useMemo(() => {
        if (!searchQuery) return revertRequests;
        const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
        return revertRequests.filter((r: TransactionRevert) => {
            const checkValue = (val: any): boolean => {
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().replace(/\s+/g, '').includes(normalizedQuery);
            };

            return (
                checkValue(r.transaction?.account_no) ||
                checkValue(r.transaction?.account?.customer?.full_name) ||
                checkValue(r.reason) ||
                checkValue(r.remarks) ||
                checkValue(r.status) ||
                checkValue(r.requester?.email_address)
            );
        });
    }, [revertRequests, searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage]);

    const totalPages = Math.ceil(filteredReverts.length / itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const paginatedReverts = useMemo(() => {
        return filteredReverts.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredReverts, currentPage, itemsPerPage]);

    const PaginationControls = () => {
        if (totalPages <= 1) return null;
        return (
            <div className={`border-t p-4 flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                        <span>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className={`px-2 py-1 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>entries</span>
                    </div>
                    <span>
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredReverts.length)}</span> of <span className="font-medium">{filteredReverts.length}</span> results
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`px-2 py-1 rounded text-sm transition-colors ${currentPage === 1 ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed') : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')}`}
                        title="First Page"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === 1 ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed') : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')}`}
                    >
                        Previous
                    </button>
                    <span className={`px-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === totalPages ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed') : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')}`}
                    >
                        Next
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-2 py-1 rounded text-sm transition-colors ${currentPage === totalPages ? (isDarkMode ? 'text-gray-600 bg-gray-800 cursor-not-allowed' : 'text-gray-400 bg-gray-100 cursor-not-allowed') : (isDarkMode ? 'text-white bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300')}`}
                        title="Last Page"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    const getStatusColor = (status?: string) => {
        if (!status) return isDarkMode ? 'text-gray-500' : 'text-gray-400';
        switch (status.toLowerCase()) {
            case 'done': return 'text-green-500';
            case 'pending': return 'text-yellow-500';
            case 'rejected': return 'text-red-500';
            default: return isDarkMode ? 'text-gray-500' : 'text-gray-400';
        }
    };

    // Super admin guard
    if (String(userRoleId) !== '7') {
        return (
            <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-950 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <div className="text-center">
                    <RefreshCw size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Access Restricted</p>
                    <p className="text-sm mt-2">Only Super Admins can view Transaction Revert Requests.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
            {/* List Panel */}
            <div className={`overflow-hidden flex-1 flex flex-col md:pb-0 ${mobileView === 'details' ? 'hidden md:flex' : ''}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className={`border-b flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Transaction Revert Requests
                                </h1>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => fetchRevertRequests(true)}
                                        disabled={isLoading}
                                        className={`p-2 rounded ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                                        title="Refresh"
                                    >
                                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                            <GlobalSearch 
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                isDarkMode={isDarkMode}
                                colorPalette={colorPalette}
                                placeholder="Search revert requests..."
                            />
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-500">{error}</div>
                        ) : filteredReverts.length > 0 ? (
                            <div className="space-y-0">
                                {paginatedReverts.map((revert: TransactionRevert) => (
                                    <div
                                        key={revert.id}
                                        onClick={() => handleRowClick(revert)}
                                        className={`flex items-start px-4 py-3 cursor-pointer transition-colors border-b ${isDarkMode
                                            ? `hover:bg-gray-800 border-b-gray-800 ${selectedRevert?.id === revert.id ? 'bg-gray-800' : ''}`
                                            : `hover:bg-gray-100 border-b-gray-200 ${selectedRevert?.id === revert.id ? 'bg-gray-100' : ''}`
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className={`font-semibold text-sm mb-0.5 truncate uppercase flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                <span className="truncate">
                                                    {revert.transaction?.account?.customer?.full_name || revert.transaction?.account_no || `Request #${revert.id}`}
                                                </span>
                                                <span className={`text-[10px] font-medium tracking-wide flex-shrink-0 ml-2 capitalize ${getStatusColor(revert.status)}`}>
                                                    {(revert.status || 'PENDING').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                                                {revert.transaction?.account_no && (
                                                    <>
                                                        <span className="font-medium text-blue-500">{revert.transaction.account_no}</span>
                                                        <span className="mx-1.5 opacity-50">|</span>
                                                    </>
                                                )}
                                                <span>{formatDate(revert.created_at)}</span>
                                                {revert.requester?.email_address && (
                                                    <>
                                                        <span className="mx-1.5 opacity-50">|</span>
                                                        <span className="truncate">{revert.requester.email_address}</span>
                                                    </>
                                                )}
                                            </div>
                                            {revert.reason && (
                                                <div className={`text-xs truncate mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {revert.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`text-center py-20 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                No revert requests found
                            </div>
                        )}
                    </div>
                    {!isLoading && filteredReverts.length > 0 && <PaginationControls />}
                </div>
            </div>

            {/* Mobile details panel */}
            {selectedRevert && mobileView === 'details' && (
                <div className={`md:hidden flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                    <TransactionsRevertDetails
                        revert={selectedRevert}
                        onClose={handleMobileBack}
                        onRefresh={fetchRevertRequests}
                        isDarkMode={isDarkMode}
                        colorPalette={colorPalette}
                        onUpdate={(updated: TransactionRevert) => setSelectedRevert(updated)}
                    />
                </div>
            )}

            {/* Desktop details panel */}
            {selectedRevert && (mobileView !== 'details' || window.innerWidth >= 768) && (
                <div className="hidden md:block flex-shrink-0 overflow-hidden">
                    <TransactionsRevertDetails
                        revert={selectedRevert}
                        onClose={() => setSelectedRevert(null)}
                        onRefresh={fetchRevertRequests}
                        isDarkMode={isDarkMode}
                        colorPalette={colorPalette}
                        onUpdate={(updated: TransactionRevert) => setSelectedRevert(updated)}
                    />
                </div>
            )}
        </div>
    );
};

export default TransactionsRevert;
