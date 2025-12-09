import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Activity, 
  Save, 
  X, 
  LayoutGrid, 
  List as ListIcon, 
  Cpu,
  TrendingUp,
  Shield,
  Globe,
  Award,
  ChevronRight,
  Radar,
  Target,
  Filter,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { analyzePlayerFit, generateScoutingShortlist, getRealPlayerData } from './services/geminiService';
import { Player, Position, ScoutingReport, Recommendation } from './types';

// --- Types & Mock Data ---

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateAge = (dob: string) => {
  const birthDate = new Date(dob);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const initialPlayers: Player[] = [
  {
    id: '1',
    name: 'Erling Haaland',
    country: 'Norway',
    dob: '2000-07-21',
    team: 'Manchester City',
    position: Position.ST,
    marketValue: 180,
    photoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d6dbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' 
  },
  {
    id: '2',
    name: 'Jude Bellingham',
    country: 'England',
    dob: '2003-06-29',
    team: 'Real Madrid',
    position: Position.CAM,
    marketValue: 180,
    photoUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '3',
    name: 'Alphonso Davies',
    country: 'Canada',
    dob: '2000-11-02',
    team: 'Bayern Munich',
    position: Position.LB,
    marketValue: 70,
    photoUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '4',
    name: 'Bukayo Saka',
    country: 'England',
    dob: '2001-09-05',
    team: 'Arsenal',
    position: Position.RW,
    marketValue: 120,
    photoUrl: 'https://images.unsplash.com/photo-1628891265328-4b2980291d87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: '5',
    name: 'Virgil van Dijk',
    country: 'Netherlands',
    dob: '1991-07-08',
    team: 'Liverpool',
    position: Position.CB,
    marketValue: 35,
    photoUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
  }
];

// --- Components ---

interface SidebarProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => (
  <div className="w-20 lg:w-72 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col h-screen sticky top-0 z-30">
    <div className="p-6 flex items-center gap-4 border-b border-slate-800/50">
      <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl shadow-lg shadow-emerald-500/20 group">
         <Activity className="text-white h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
         <div className="absolute inset-0 rounded-xl ring-1 ring-white/20"></div>
      </div>
      <div className="hidden lg:block">
        <h1 className="text-lg font-bold text-white tracking-tight leading-none">ScoutVision</h1>
        <span className="text-[10px] font-medium text-emerald-400 tracking-widest uppercase">Pro Analytics</span>
      </div>
    </div>
    
    <nav className="flex-1 p-4 space-y-2 mt-4">
      {[
        { id: 'database', icon: Users, label: 'Player Database', desc: 'Manage prospects' },
        { id: 'reports', icon: Radar, label: 'Scout Engine', desc: 'AI Recommendations' },
      ].map((item) => (
        <button 
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden
            ${activeTab === item.id 
              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === item.id ? 'bg-emerald-500/20' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
            <item.icon size={20} />
          </div>
          <div className="hidden lg:block text-left">
            <span className="block font-semibold text-sm">{item.label}</span>
            <span className="block text-xs opacity-60 font-normal">{item.desc}</span>
          </div>
          {activeTab === item.id && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full"></div>
          )}
        </button>
      ))}
    </nav>
    
    <div className="p-6 hidden lg:block">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
         <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
         <p className="text-xs text-slate-400 mb-2">System Status</p>
         <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Gemini 2.5 Active
         </div>
      </div>
    </div>
  </div>
);

interface PlayerCardProps {
  player: Player;
  onEdit: (p: Player) => void;
  onDelete: (id: string) => void;
  onAnalyze: (p: Player) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  onEdit, 
  onDelete, 
  onAnalyze 
}) => {
  return (
    <div className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 hover:-translate-y-1 flex flex-col">
      
      {/* Header & Image */}
      <div className="h-24 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,#ffffff_1px,transparent_0)] [background-size:16px_16px]"></div>
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-950/50 text-emerald-400 border border-emerald-500/20 backdrop-blur-md shadow-sm">
            {player.position}
          </span>
        </div>
      </div>

      <div className="px-5 relative flex-1 flex flex-col">
        <div className="relative -mt-10 mb-3">
           <div className="w-20 h-20 rounded-2xl border-4 border-slate-900 shadow-xl overflow-hidden bg-slate-800 group-hover:ring-2 group-hover:ring-emerald-500/50 transition-all">
              <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
           </div>
        </div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">{player.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
               <Globe size={12} className="text-slate-500" /> {player.country}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Market Value</p>
            <p className="text-emerald-400 font-bold font-mono text-lg">€{player.marketValue}M</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 py-3 border-t border-slate-800/50 mt-auto">
           <div className="bg-slate-950/30 p-2 rounded-lg text-center border border-slate-800/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Age</p>
              <p className="text-slate-200 font-semibold text-sm">{calculateAge(player.dob)}</p>
           </div>
           <div className="bg-slate-950/30 p-2 rounded-lg text-center border border-slate-800/30 truncate px-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Team</p>
              <p className="text-slate-200 font-semibold text-sm truncate">{player.team}</p>
           </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4 mb-5">
          <button 
            onClick={() => onAnalyze(player)}
            className="col-span-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 group/btn"
          >
            <Cpu size={14} className="group-hover/btn:animate-pulse" /> ANALYZE
          </button>
          <button 
            onClick={() => onEdit(player)}
            className="col-span-1 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
            title="Edit / Update"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(player.id)}
            className="col-span-1 flex items-center justify-center bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-slate-700 hover:border-red-500/30"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl shadow-black/50 animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            {icon && <div className="text-emerald-500">{icon}</div>}
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState('database');
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  
  // Modal States
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [analyzingPlayer, setAnalyzingPlayer] = useState<Player | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Player>>({});
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  
  // Analysis State
  const [systemDescription, setSystemDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScoutingReport | null>(null);

  // Scout Engine State
  const [scoutFormation, setScoutFormation] = useState('');
  const [scoutSystem, setScoutSystem] = useState('');
  const [scoutRequirements, setScoutRequirements] = useState('');
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutRecommendations, setScoutRecommendations] = useState<Recommendation[] | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAutoFill = async () => {
    if (!formData.name) return;
    setAutoFillLoading(true);
    try {
        const realData = await getRealPlayerData(formData.name);
        setFormData(prev => ({ ...prev, ...realData }));
        showNotification("Player Data Auto-Filled");
    } catch (error) {
        console.error(error);
        alert("Could not find player data. Check name or API Key.");
    } finally {
        setAutoFillLoading(false);
    }
  };

  // CRUD Operations
  const handleSavePlayer = () => {
    if (!formData.name || !formData.position || !formData.team) return;

    if (editingPlayer) {
      setPlayers(players.map(p => p.id === editingPlayer.id ? { ...editingPlayer, ...formData } as Player : p));
      showNotification("Player Updated Successfully");
    } else {
      const newPlayer: Player = {
        id: generateId(),
        name: formData.name || '',
        country: formData.country || 'Unknown',
        dob: formData.dob || '2000-01-01',
        team: formData.team || '',
        position: formData.position as Position,
        marketValue: Number(formData.marketValue) || 0,
        photoUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1500648767791-00dcc994a43e' : '1504639725590-34d0984388bd'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80`
      };
      setPlayers([...players, newPlayer]);
      showNotification("New Prospect Added");
    }
    closePlayerModal();
  };

  const handleDeletePlayer = (id: string) => {
    if (window.confirm('Are you sure you want to delete this player record?')) {
      setPlayers(players.filter(p => p.id !== id));
      showNotification("Player Removed");
    }
  };

  const openAddModal = () => {
    setEditingPlayer(null);
    setFormData({});
    setIsPlayerModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormData({ ...player });
    setIsPlayerModalOpen(true);
  };

  const closePlayerModal = () => {
    setIsPlayerModalOpen(false);
    setEditingPlayer(null);
    setFormData({});
  };

  const openAnalysisModal = (player: Player) => {
    setAnalyzingPlayer(player);
    setAnalysisResult(null);
    setSystemDescription('');
    setAdditionalInfo('');
    setIsAnalysisModalOpen(true);
  };

  const handleAnalyze = async () => {
    if (!analyzingPlayer || !systemDescription) return;
    setAnalysisLoading(true);
    try {
      const result = await analyzePlayerFit(analyzingPlayer, systemDescription, additionalInfo);
      setAnalysisResult({
        playerId: analyzingPlayer.id,
        system: systemDescription,
        ...result
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to generate analysis. Check API Key.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleScoutSearch = async () => {
    if(!scoutFormation || !scoutSystem || !scoutRequirements) return;
    setScoutLoading(true);
    setScoutRecommendations(null);
    try {
        const result = await generateScoutingShortlist(players, scoutFormation, scoutSystem, scoutRequirements);
        setScoutRecommendations(result.recommendations);
    } catch (error: any) {
        console.error("Scouting failed", error);
        alert(error.message || "Scouting engine failed. Check API Key and try again.");
    } finally {
        setScoutLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, searchQuery]);

  // Helper to find player obj from recommendation
  const getPlayerById = (id: string) => players.find(p => p.id === id);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
           <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 size={16} /> {notification}
           </div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 h-screen flex flex-col custom-scrollbar">
        {/* Header */}
        <header className="bg-slate-950/60 backdrop-blur-md border-b border-slate-800/50 p-6 sticky top-0 z-20 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {activeTab === 'database' ? (
                    <>
                        <Users className="text-emerald-400" size={24}/> Player Database
                    </>
                ) : (
                    <>
                        <Target className="text-emerald-400" size={24}/> Tactical Analysis
                    </>
                )}
              </h1>
              <p className="text-slate-400 text-sm mt-1 ml-8">
                {activeTab === 'database' 
                  ? `Managing ${players.length} active profiles with real-time data.` 
                  : 'AI-driven system matching and squad building.'}
              </p>
            </div>
            
            {activeTab === 'database' && (
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search player, team..." 
                    className="bg-slate-900/50 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none w-64 transition-all placeholder:text-slate-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex bg-slate-900/50 rounded-xl p-1 border border-slate-800">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
                  >
                    <ListIcon size={18} />
                  </button>
                </div>

                <button 
                  onClick={openAddModal}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Add Prospect</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'database' ? (
            <>
              {filteredPlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed border-slate-800/50 rounded-2xl bg-slate-900/20">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                     <Users size={32} className="text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white">No players found</h3>
                  <p className="text-slate-500 mt-1 max-w-xs">Try adjusting your search or add a new player to your database.</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6" : "space-y-3"}>
                  {filteredPlayers.map(player => (
                    viewMode === 'grid' ? (
                      <PlayerCard 
                        key={player.id} 
                        player={player} 
                        onEdit={openEditModal} 
                        onDelete={handleDeletePlayer} 
                        onAnalyze={openAnalysisModal}
                      />
                    ) : (
                      <div key={player.id} className="group bg-slate-900/40 backdrop-blur border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 hover:bg-slate-900/60 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-lg">{player.name}</h4>
                              <div className="flex items-center gap-3 text-sm">
                                 <span className="text-emerald-400 font-mono font-medium bg-emerald-500/10 px-1.5 rounded">{player.position}</span>
                                 <span className="text-slate-500">• {player.team}</span>
                                 <span className="text-slate-500">• {calculateAge(player.dob)} yrs</span>
                              </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Market Value</p>
                              <p className="font-mono text-emerald-400 font-bold text-lg">€{player.marketValue}M</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openAnalysisModal(player)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/20" title="Analyze"><Cpu size={18}/></button>
                              <button onClick={() => openEditModal(player)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700" title="Edit"><Edit2 size={18}/></button>
                              <button onClick={() => handleDeletePlayer(player.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700" title="Delete"><Trash2 size={18}/></button>
                            </div>
                         </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </>
          ) : (
             <div className="grid lg:grid-cols-12 gap-8">
               {/* Scouting Config Panel */}
               <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl sticky top-24">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                           <Filter size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Tactical Filters</h2>
                     </div>
                     
                     <div className="space-y-5">
                        <div>
                           <label className="block text-xs uppercase text-slate-500 font-bold mb-2 ml-1">Tactical Formation</label>
                           <input 
                             className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-700 transition-all"
                             placeholder="e.g. 4-3-3 High Press, 3-5-2 Counter"
                             value={scoutFormation}
                             onChange={e => setScoutFormation(e.target.value)}
                           />
                        </div>
                        <div>
                           <label className="block text-xs uppercase text-slate-500 font-bold mb-2 ml-1">System Description</label>
                           <textarea 
                             className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none placeholder:text-slate-700 text-sm leading-relaxed transition-all"
                             placeholder="Describe how your team plays. E.g. 'We play a high defensive line with inverted wingers and a false nine.'"
                             value={scoutSystem}
                             onChange={e => setScoutSystem(e.target.value)}
                           />
                        </div>
                        <div>
                           <label className="block text-xs uppercase text-slate-500 font-bold mb-2 ml-1">Required Profile</label>
                           <textarea 
                             className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none placeholder:text-slate-700 text-sm leading-relaxed transition-all"
                             placeholder="What are you looking for? E.g. 'A fast left-footed winger who can track back.'"
                             value={scoutRequirements}
                             onChange={e => setScoutRequirements(e.target.value)}
                           />
                        </div>
                        
                        <button 
                          onClick={handleScoutSearch}
                          disabled={scoutLoading || !scoutFormation || !scoutSystem || !scoutRequirements}
                          className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all relative overflow-hidden shadow-lg
                            ${scoutLoading || !scoutFormation || !scoutSystem || !scoutRequirements
                              ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 hover:-translate-y-0.5'}`}
                        >
                          {scoutLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Scouting...
                            </>
                          ) : (
                            <>
                              <Search size={18} /> Find Matches
                            </>
                          )}
                        </button>
                     </div>
                  </div>
               </div>

               {/* Results Panel */}
               <div className="lg:col-span-8">
                  {!scoutRecommendations ? (
                     <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900/30 border border-slate-800/50 rounded-2xl border-dashed">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                           <Radar size={40} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">AI Scout Engine Ready</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                           Fill out the filters on the left. Gemini 2.5 will scan your entire database to find players that best fit your tactical system.
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                           <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <Award className="text-emerald-500" /> Top Recommendations
                           </h3>
                           <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                              Based on {players.length} profiles
                           </span>
                        </div>

                        <div className="space-y-4">
                           {scoutRecommendations.map((rec, index) => {
                              const player = getPlayerById(rec.playerId);
                              if (!player) return null;
                              
                              return (
                                 <div key={rec.playerId} className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 transition-all hover:bg-slate-900">
                                    {/* Rank */}
                                    <div className="flex-shrink-0 text-4xl font-black text-slate-800 select-none">
                                       #{index + 1}
                                    </div>
                                    
                                    {/* Player Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                       <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                                          <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                                       </div>
                                       <div>
                                          <h4 className="font-bold text-white text-lg">{player.name}</h4>
                                          <div className="flex items-center gap-2 text-sm text-slate-400">
                                             <span className="text-emerald-400 font-medium">{player.position}</span>
                                             <span>• {player.team}</span>
                                             <span>• €{player.marketValue}M</span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Analysis */}
                                    <div className="flex-1 md:max-w-md">
                                       <div className="flex justify-between text-xs uppercase font-bold text-slate-500 mb-1">
                                          <span>Fit Score</span>
                                          <span className={rec.matchScore >= 80 ? 'text-emerald-400' : 'text-yellow-400'}>{rec.matchScore}%</span>
                                       </div>
                                       <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                                          <div 
                                             className={`h-full rounded-full ${rec.matchScore >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
                                             style={{ width: `${rec.matchScore}%` }}
                                          ></div>
                                       </div>
                                       <p className="text-sm text-slate-300 leading-snug">"{rec.reasoning}"</p>
                                       <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          <TrendingUp size={12} /> Key: {rec.keyAttribute}
                                       </div>
                                    </div>

                                    {/* Action */}
                                    <button 
                                       onClick={() => openAnalysisModal(player)}
                                       className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors shrink-0"
                                    >
                                       <ChevronRight size={20} />
                                    </button>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}
               </div>
             </div>
          )}
        </div>

        {/* Add/Edit Player Modal */}
        <Modal 
          isOpen={isPlayerModalOpen} 
          onClose={closePlayerModal} 
          title={editingPlayer ? "Edit Profile" : "New Prospect"}
          icon={<Users size={24} />}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs uppercase text-slate-500 font-bold mb-1.5 ml-1">Full Name</label>
              <div className="relative flex gap-2">
                <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Kylian Mbappé"
                />
                <button 
                    onClick={handleAutoFill}
                    disabled={autoFillLoading || !formData.name}
                    className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/30 rounded-xl px-4 flex items-center gap-2 font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Auto-fill data with AI"
                >
                    {autoFillLoading ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div> : <Wand2 size={18} />}
                    <span className="hidden sm:inline">Auto-Fill</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 ml-1">Tip: Type a famous player's name and click Auto-Fill.</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1.5 ml-1">Position</label>
                <div className="relative">
                    <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                    value={formData.position || ''}
                    onChange={e => setFormData({...formData, position: e.target.value as Position})}
                    >
                    <option value="">Select Position</option>
                    {Object.values(Position).map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronRight size={16} className="rotate-90"/>
                    </div>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1.5 ml-1">Date of Birth</label>
                <input 
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 outline-none"
                  value={formData.dob || ''}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1.5 ml-1">Country</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 outline-none placeholder:text-slate-600"
                  value={formData.country || ''}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  placeholder="e.g. France"
                />
              </div>
               <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1.5 ml-1">Value (€M)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                    <input 
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 pl-8 text-white focus:border-emerald-500 outline-none placeholder:text-slate-600"
                    value={formData.marketValue || ''}
                    onChange={e => setFormData({...formData, marketValue: parseFloat(e.target.value)})}
                    placeholder="0"
                    />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-500 font-bold mb-1.5 ml-1">Current Team</label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 outline-none placeholder:text-slate-600"
                value={formData.team || ''}
                onChange={e => setFormData({...formData, team: e.target.value})}
                placeholder="e.g. Paris Saint-Germain"
              />
            </div>
            <div className="pt-4">
                <button 
                onClick={handleSavePlayer}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5"
                >
                <Save size={20} />
                {editingPlayer ? "Update Player" : "Save Player Profile"}
                </button>
            </div>
          </div>
        </Modal>

        {/* Analysis Modal */}
        <Modal 
          isOpen={isAnalysisModalOpen} 
          onClose={() => setIsAnalysisModalOpen(false)} 
          title="Tactical Report"
          icon={<Cpu size={24} />}
        >
           <div className="space-y-6">
             {/* Player Context Header */}
             <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 shrink-0 z-10">
                   <img src={analyzingPlayer?.photoUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="z-10">
                   <h3 className="font-bold text-white text-xl">{analyzingPlayer?.name}</h3>
                   <div className="flex gap-2 text-sm text-slate-400 mt-1">
                      <span className="bg-slate-800 px-2 rounded text-slate-300">{analyzingPlayer?.position}</span>
                      <span className="text-slate-600">|</span>
                      <span>{analyzingPlayer?.team}</span>
                   </div>
                </div>
             </div>

             {!analysisResult ? (
               <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="block text-sm text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                        <Activity size={16} />
                        Target System & Tactical Role
                    </label>
                    <textarea 
                      className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed placeholder:text-slate-700"
                      placeholder="Describe your tactical setup (e.g., High-pressing 4-3-3) and what you need from this player..."
                      value={systemDescription}
                      onChange={e => setSystemDescription(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-blue-400 font-semibold mb-3 flex items-center gap-2">
                        <ListIcon size={16} />
                        Additional Context (Optional)
                    </label>
                    <textarea 
                      className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed placeholder:text-slate-700"
                      placeholder="E.g., Playing against a deep block, or need leadership qualities. AI will use real-world knowledge if player is famous."
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    disabled={analysisLoading || !systemDescription}
                    className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all relative overflow-hidden
                      ${analysisLoading || !systemDescription 
                        ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                        : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-emerald-500/25 shadow-lg hover:-translate-y-0.5'}`}
                  >
                    {analysisLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="animate-pulse">Analyzing 2.5m Data Points...</span>
                      </>
                    ) : (
                      <>
                        <Cpu size={20} /> Generate Analysis Report
                      </>
                    )}
                  </button>
               </div>
             ) : (
               <div className="space-y-6 animate-slide-up">
                  {/* Score Dashboard */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className={`absolute inset-0 opacity-10 ${analysisResult.fitScore >= 80 ? 'bg-emerald-500' : analysisResult.fitScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Fit Score</span>
                        <span className={`text-4xl font-black ${analysisResult.fitScore >= 80 ? 'text-emerald-400' : analysisResult.fitScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {analysisResult.fitScore}
                        </span>
                    </div>
                    <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Verdict</span>
                        <span className="text-white font-bold text-lg leading-tight flex items-center gap-2">
                            <Award size={18} className="text-emerald-500" />
                            {analysisResult.tacticalVerdict}
                        </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/50">
                    <h4 className="text-slate-200 font-semibold text-sm mb-3 flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500" /> Executive Summary
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-emerald-500/30 pl-4">
                        {analysisResult.summary}
                    </p>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 rounded-xl p-5 border border-emerald-500/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50"></div>
                        <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                            <TrendingUp size={14} /> Strengths
                        </h4>
                        <ul className="space-y-3">
                            {analysisResult.strengths.map((s, i) => (
                                <li key={i} className="text-slate-300 text-sm flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 shrink-0"></div>
                                {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-slate-950/50 rounded-xl p-5 border border-red-500/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
                        <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Shield size={14} /> Risks
                        </h4>
                        <ul className="space-y-3">
                            {analysisResult.weaknesses.map((w, i) => (
                                <li key={i} className="text-slate-300 text-sm flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shadow shadow-red-400/50 shrink-0"></div>
                                {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                  </div>

                  <button 
                    onClick={() => setAnalysisResult(null)}
                    className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-all border border-slate-800 hover:border-slate-700"
                  >
                    Back to Configuration
                  </button>
               </div>
             )}
           </div>
        </Modal>

      </main>
    </div>
  );
}