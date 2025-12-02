import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  Target, 
  Shield, 
  Zap, 
  Calendar, 
  ChevronRight, 
  CheckCircle,
  Menu,
  X,
  Search,
  Clock,
  Map,
  Copy,
  Mic,
  MicOff,
  Plus,
  Image as ImageIcon,
  Heart,
  MessageSquare,
  Share2,
  Swords,
  Crown,
  AlertCircle,
  Flag,
  User,
  Settings,
  Camera,
  Save,
  Gamepad2,
  Hash,
  Trash2,
  Upload,
  Twitter,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ▼▼▼ ここから追加・変更 ▼▼▼
import { db, storage } from './firebase'; // 作成したfirebase.jsを読み込み
import { 
  collection, addDoc, deleteDoc, doc, updateDoc, 
  onSnapshot, query, orderBy, arrayUnion ,getDoc, setDoc
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
// ▲▲▲ ここまで追加 ▲▲▲

// --- Global Constants & Styles ---
// 日本語表記
const MODES = ["ランクマッチ", "バトルロイヤル", "ゾンビモード", "カジュアル"];
const RANKS = ["ルーキー", "ベテラン", "エリート", "プロ", "マスター", "グランドマスター", "レジェンド"];
const SKILL_LEVELS = ["中堅未満", "中堅以下", "中堅", "中堅以上"];
const ROLES = ["スレイヤー", "アンカー", "オブジェクト", "スナイパー", "サポート", "フレックス"];
const SCRIM_MODES = ["ハードポイント", "サーチ＆デストロイ", "コントロール", "混合 (BO3)", "混合 (BO5)"];
const MAPS = ["サミット", "スタンドオフ", "レイド", "テイクオフ", "ターミナル", "スラム", "ファイアリングレンジ", "ハックニーヤード"];
const EVENT_TYPES = ["大会", "交流戦 (スクリム)", "1vs1", "カスタムルーム"];

// --- Shared Components ---

const Button = ({ children, primary = false, outline = false, danger = false, className = "", onClick, size = "md", disabled = false }) => {
  const sizeClasses = size === "sm" ? "px-4 py-2 text-sm" : "px-8 py-4 text-lg";
  const baseStyle = `${sizeClasses} rounded-full font-bold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`;
  
  let variantStyle = "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:border-slate-600";
  if (primary) variantStyle = "bg-lime-400 text-black hover:bg-lime-300 hover:shadow-lime-400/50";
  if (outline) variantStyle = "bg-transparent text-lime-400 border border-lime-400 hover:bg-lime-400/10";
  if (danger) variantStyle = "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20";

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variantStyle} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "bg-slate-800" }) => (
  <span className={`${color} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider`}>
    {children}
  </span>
);

// --- Modals ---

// 1. Profile Edit Modal
const ProfileModal = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState(profile);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><User className="text-lime-400" /> プロフィール設定</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-800 group-hover:border-lime-400 transition-colors">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-lime-400 to-green-500 flex items-center justify-center text-black font-bold text-3xl">
                    {formData.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-slate-800 p-2 rounded-full border border-slate-700 text-white shadow-lg">
                <Camera size={14} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <p className="text-xs text-slate-500 mt-2">タップして画像を変更</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">表示名 (アプリ内)</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none" placeholder="表示名を入力" />
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">現在のランク</label>
             <select name="rank" value={formData.rank} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none">
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
          </div>

          <div className="space-y-4 pt-4 mt-6 border-t border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Gamepad2 size={16} className="text-lime-400"/> ゲーム連携情報</h4>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">ゲーム名 (CoDモバイル)</label>
              <input type="text" name="gameName" value={formData.gameName} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none" placeholder="例: Sniper_01" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Twitter (X) ID</label>
                <div className="relative">
                  <Twitter size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input type="text" name="twitterName" value={formData.twitterName} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-lg pl-10 p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none" placeholder="@username" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Parallel ID</label>
                <div className="relative">
                  <MessageSquare size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input type="text" name="parallelName" value={formData.parallelName} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-lg pl-10 p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none" placeholder="Parallel名" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Discord ID</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input type="text" name="discordName" value={formData.discordName} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-lg pl-10 p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none" placeholder="user#1234" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <Button size="sm" outline onClick={onClose}>キャンセル</Button>
          <Button size="sm" primary onClick={() => onSave(formData)}><Save size={16}/> 保存する</Button>
        </div>
      </motion.div>
    </div>
  );
};

// 1.5 View Applicant Profile Modal
const ApplicantProfileModal = ({ applicant, onClose }) => {
  if (!applicant) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative z-10">
        <div className="relative h-24 bg-gradient-to-r from-slate-800 to-slate-900">
           <button onClick={onClose} className="absolute top-2 right-2 bg-black/20 p-1 rounded-full text-white hover:bg-black/40 transition-colors"><X size={20}/></button>
        </div>
        <div className="px-6 pb-6 -mt-12 text-center">
           <div className="w-24 h-24 rounded-full border-4 border-slate-900 bg-slate-800 mx-auto overflow-hidden mb-3 shadow-lg">
              {applicant.avatar ? (
                <img src={applicant.avatar} alt={applicant.name} className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-lime-400 to-green-500 flex items-center justify-center text-black font-bold text-3xl">
                  {applicant.name.charAt(0)}
                </div>
              )}
           </div>
           
           <h3 className="text-xl font-bold text-white mb-1">{applicant.name}</h3>
           <div className="inline-block bg-slate-800 text-lime-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700 mb-6">
             {applicant.rank}
           </div>

           <div className="space-y-3 text-left">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                 <span className="text-xs text-slate-500 font-bold">CoD名</span>
                 <span className="text-sm font-bold text-white">{applicant.gameName || "未設定"}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                 <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><Twitter size={12}/> Twitter</span>
                 <span className="text-sm font-bold text-white">{applicant.twitterName || "未設定"}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                 <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><MessageSquare size={12}/> Parallel</span>
                 <span className="text-sm font-bold text-white">{applicant.parallelName || "未設定"}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                 <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><Hash size={12}/> Discord</span>
                 <span className="text-sm font-bold text-white">{applicant.discordName || "未設定"}</span>
              </div>
           </div>
           
           <div className="mt-6 flex gap-2">
             <Button outline size="sm" className="flex-1" onClick={onClose}>閉じる</Button>
             <Button primary size="sm" className="flex-1" onClick={() => alert(`${applicant.name}さんのDiscord IDをコピーしました`)}>連絡する</Button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

// 1.6 View Applicants List Modal
const ApplicantsListModal = ({ applicants, onClose }) => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="text-lime-400" size={18} /> 応募者一覧 ({applicants.length})</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {applicants.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              まだ応募者はいません。
            </div>
          ) : (
            applicants.map((user, idx) => (
              <div key={idx} className="bg-slate-800 p-3 rounded-xl flex items-center justify-between hover:bg-slate-700 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="text-xs text-lime-400">{user.rank}</div>
                    </div>
                 </div>
                 <Button size="sm" outline className="!py-1 !px-3 text-xs" onClick={() => setSelectedApplicant(user)}>
                   プロフィール
                 </Button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Nested Modal for Profile View */}
      {selectedApplicant && (
        <ApplicantProfileModal applicant={selectedApplicant} onClose={() => setSelectedApplicant(null)} />
      )}
    </div>
  );
};

// 2. Member Recruitment Modal
const CreateRecruitmentModal = ({ currentUser, onClose, onSubmit }) => {
  const [mode, setMode] = useState("ランクマッチ");
  const [rank, setRank] = useState("マスター");
  const [needed, setNeeded] = useState(1);
  const [mic, setMic] = useState("required");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [comment, setComment] = useState("");

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      if (selectedRoles.length < 3) setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      id: Date.now(),
      host: currentUser,
      mode, rank, needed, mic, roles: selectedRoles, comment,
      timestamp: "たった今", 
      joined: false,
      applicants: [] // Initialize applicants
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="text-lime-400" /> メンバー募集を作成</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">ゲームモード</label>
            <div className="grid grid-cols-2 gap-2">{MODES.map(m => <button key={m} onClick={() => setMode(m)} className={`p-3 rounded-lg text-sm font-bold border transition-colors ${mode === m ? 'bg-lime-400 text-black border-lime-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{m}</button>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">最低ランク</label>
              <select value={rank} onChange={(e) => setRank(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none">{RANKS.map(r => <option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">募集人数 (@)</label>
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 border border-slate-700">
                <button onClick={() => setNeeded(Math.max(1, needed - 1))} className="w-8 h-8 rounded bg-slate-700 text-white flex justify-center items-center hover:bg-slate-600">-</button>
                <span className="flex-1 text-center font-bold text-white">{needed}</span>
                <button onClick={() => setNeeded(Math.min(4, needed + 1))} className="w-8 h-8 rounded bg-slate-700 text-white flex justify-center items-center hover:bg-slate-600">+</button>
              </div>
            </div>
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">コメント</label>
             <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="例: ポイント重視で動きます。連携取れる方！" className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none h-24 resize-none"/>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <Button size="sm" outline onClick={onClose}>キャンセル</Button>
          <Button size="sm" primary onClick={handleSubmit} disabled={!comment}>募集を開始</Button>
        </div>
      </motion.div>
    </div>
  );
};

// 3. Scrim Creation Modal
const CreateScrimModal = ({ currentUser, onClose, onSubmit }) => {
  const [teamName, setTeamName] = useState("");
  const [time, setTime] = useState("21:00");
  const [mode, setMode] = useState("混合 (BO5)");
  const [map, setMap] = useState("マップバン/ピック");
  const [rank, setRank] = useState("中堅");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit({
      id: Date.now(),
      host: currentUser, 
      team: teamName || "自チーム",
      time, mode, map, rank, comment,
      status: "募集中", 
      applied: false,
      applicants: [] // Initialize
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Swords className="text-lime-400" /> スクリム相手を募集</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">チーム名</label>
            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="チーム名を入力" className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">開始時間</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none"/>
            </div>
             <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">希望実力帯</label>
              <select value={rank} onChange={(e) => setRank(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none">
                {SKILL_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">ルール / モード</label>
            <div className="grid grid-cols-2 gap-2">{SCRIM_MODES.map(m => <button key={m} onClick={() => setMode(m)} className={`p-2 rounded-lg text-xs font-bold border transition-colors ${mode === m ? 'bg-lime-400 text-black border-lime-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{m}</button>)}</div>
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">コメント / 詳細条件</label>
             <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="例: 競技ルール準拠。マップBAN/PICKあり。DiscordでVC可能なチーム。" className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none h-24 resize-none"/>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <Button size="sm" outline onClick={onClose}>キャンセル</Button>
          <Button size="sm" primary onClick={handleSubmit} disabled={!teamName}>募集を投稿</Button>
        </div>
      </motion.div>
    </div>
  );
};

// 4. Event Creation Modal
const CreateEventModal = ({ currentUser, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("大会");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = () => {
    onSubmit({
      id: Date.now(),
      name: title,
      date: date || "未定",
      type: type.split(" ")[0],
      host: currentUser,
      joined: false,
      desc
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Crown className="text-lime-400" /> イベントを作成</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">イベント名</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 第1回 CoD交流会" className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">開催日時</label>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">イベントタイプ</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none">{EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">詳細・ルール</label>
             <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="賞金有無、ルール詳細、参加資格などを記入" className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none h-24 resize-none"/>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <Button size="sm" outline onClick={onClose}>キャンセル</Button>
          <Button size="sm" primary onClick={handleSubmit} disabled={!title}>イベントを作成</Button>
        </div>
      </motion.div>
    </div>
  );
};

// 5. Loadout Creation Modal
const CreateLoadoutModal = ({ currentUser, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      id: Date.now(),
      title,
      author: currentUser,
      image,
      likes: 0,
      imageColor: "bg-slate-800"
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="text-lime-400" /> 画像投稿 (ロードアウト)</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">タイトル</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 最強Krig6カスタム" className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm border border-slate-700 focus:border-lime-400 outline-none"/>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">画像 (スクリーンショット)</label>
            <div 
              className="w-full aspect-video bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-lime-400 hover:bg-slate-800/50 transition-colors overflow-hidden"
              onClick={() => fileInputRef.current.click()}
            >
               {image ? (
                 <img src={image} alt="Preview" className="w-full h-full object-contain" />
               ) : (
                 <>
                   <Upload size={32} className="text-slate-500 mb-2"/>
                   <span className="text-sm text-slate-400">タップして画像を選択</span>
                 </>
               )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <Button size="sm" outline onClick={onClose}>キャンセル</Button>
          <Button size="sm" primary onClick={handleSubmit} disabled={!title || !image}>投稿する</Button>
        </div>
      </motion.div>
    </div>
  );
};


// --- Sub-Views (Functional Pages) ---

// 1. RECRUITMENT BOARD VIEW
const RecruitmentBoardView = ({ currentUser, posts, onAddPost, onJoinPost, onDeletePost }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [currentApplicants, setCurrentApplicants] = useState([]);
  const [filterMode, setFilterMode] = useState("全て");

  const handleCreatePost = (newPost) => {
    onAddPost(newPost);
    setIsModalOpen(false);
  };

  const handleViewApplicants = (applicants) => {
    setCurrentApplicants(applicants);
    setIsApplicantsModalOpen(true);
  };

  const filteredPosts = filterMode === "全て" ? posts : posts.filter(p => p.mode === filterMode);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            チーム募集掲示板 <span className="text-sm bg-lime-400 text-black px-2 py-1 rounded font-bold align-middle">LFG</span>
          </h2>
          <p className="text-slate-400 mt-2">ランクマ・バトロワの即席パーティ募集掲示板</p>
        </div>
        <Button primary onClick={() => setIsModalOpen(true)} className="shadow-lime-400/20">
          <Plus size={20} /> 募集を作成する
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {["全て", ...MODES].map(m => (
          <button key={m} onClick={() => setFilterMode(m)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterMode === m ? 'bg-white text-black' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'}`}>{m}</button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const isMine = post.host === currentUser;
              const applicantCount = post.applicants ? post.applicants.length : 0;

              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${post.rank === 'レジェンド' ? 'bg-gradient-to-b from-purple-500 to-yellow-500' : post.rank === 'グランドマスター' ? 'bg-red-500' : 'bg-slate-600'}`}></div>
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 pl-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge color="bg-lime-400/10 text-lime-400 border border-lime-400/20">{post.mode}</Badge>
                        <span className="text-slate-500 text-xs font-bold flex items-center gap-1"><Clock size={12} /> {post.timestamp}</span>
                        {post.mic === 'required' && <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded"><Mic size={10} /> VC必須</span>}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">"{post.comment}"</h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"><Trophy size={14} className="text-yellow-500"/> {post.rank}以上</div>
                        {post.roles.map(r => <span key={r} className="text-xs text-indigo-300 bg-indigo-900/30 border border-indigo-500/30 px-2 py-1.5 rounded-lg">{r}</span>)}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 pl-3 border-t md:border-t-0 md:border-l border-slate-800 md:w-48 pt-4 md:pt-0">
                      <div className="flex items-center gap-2">
                         <div className="text-right hidden md:block"><div className="text-xs text-slate-400">募集主</div><div className="text-sm font-bold text-white">{post.host}</div></div>
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border border-slate-600">{post.host.charAt(0)}</div>
                      </div>
                      
                      {isMine ? (
                        <div className="flex flex-col gap-2 w-full">
                           <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleViewApplicants(post.applicants)}>
                              <span className="text-xs font-bold text-white">応募者</span>
                              <span className="text-xs bg-lime-400 text-black font-bold px-2 rounded-full">{applicantCount}</span>
                           </div>
                           <Button danger size="sm" onClick={() => onDeletePost(post.id)} className="w-full">
                             <Trash2 size={14} /> 削除する
                           </Button>
                        </div>
                      ) : (
                        <button onClick={() => onJoinPost(post.id)} disabled={post.joined} className={`font-bold py-2 px-6 rounded-lg transition-colors w-full md:w-auto text-sm flex items-center justify-center gap-2 ${post.joined ? 'bg-slate-800 text-slate-500 cursor-default' : 'bg-slate-800 hover:bg-lime-400 hover:text-black text-white'}`}>
                          {post.joined ? <><CheckCircle size={14} /> リクエスト済</> : <><Users size={14} /> 参加する <span className="bg-black/20 px-1.5 rounded text-[10px]">@{post.needed}</span></>}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
             <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800"><Search size={32} className="mx-auto mb-4 text-slate-600"/><p className="text-slate-500">現在、募集はありません</p><button onClick={() => setIsModalOpen(true)} className="text-lime-400 text-sm mt-2 hover:underline">最初の募集を作成する</button></div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isModalOpen && <CreateRecruitmentModal currentUser={currentUser} onClose={() => setIsModalOpen(false)} onSubmit={handleCreatePost} />}
        {isApplicantsModalOpen && <ApplicantsListModal applicants={currentApplicants} onClose={() => setIsApplicantsModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

// 2. SCRIM FINDER VIEW
const ScrimView = ({ currentUser, scrims, onAddScrim, onApplyScrim, onDeleteScrim }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [currentApplicants, setCurrentApplicants] = useState([]);
  const [filter, setFilter] = useState("全て");

  const handleCreate = (newScrim) => {
    onAddScrim(newScrim);
    setIsModalOpen(false);
  };

  const handleViewApplicants = (applicants) => {
    setCurrentApplicants(applicants);
    setIsApplicantsModalOpen(true);
  };

  const filteredScrims = filter === "全て" ? scrims : scrims.filter(s => s.status === filter);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            スクリム募集掲示板 <span className="text-sm bg-yellow-500 text-black px-2 py-1 rounded font-bold align-middle">VS</span>
          </h2>
          <p className="text-slate-400 mt-2">クラン戦・交流戦の相手探し</p>
        </div>
        <Button primary onClick={() => setIsModalOpen(true)} className="shadow-lime-400/20">
          <Plus size={20} /> 募集を作成する
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {["全て", "募集中", "終了"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-white text-black' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredScrims.length > 0 ? (
            filteredScrims.map((scrim) => {
              const isMine = scrim.host === currentUser;
              const applicantCount = scrim.applicants ? scrim.applicants.length : 0;

              return (
                <motion.div key={scrim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all">
                  <div className="p-5 flex flex-col md:flex-row items-center gap-6">
                    
                    {/* Team Info */}
                    <div className="flex items-center gap-4 w-full md:w-1/3">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-2xl text-white shadow-lg">
                        {scrim.team.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">募集チーム</div>
                        <div className="font-bold text-white text-xl">{scrim.team}</div>
                        <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1"><Trophy size={10} /> {scrim.rank}</div>
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="flex-1 w-full grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                       <div>
                         <div className="text-xs text-slate-500 font-bold uppercase mb-1">開始時間</div>
                         <div className="font-bold text-white text-lg flex items-center gap-2"><Clock size={16} className="text-lime-400"/> {scrim.time}</div>
                       </div>
                       <div>
                         <div className="text-xs text-slate-500 font-bold uppercase mb-1">ルール</div>
                         <div className="font-bold text-white flex items-center gap-2"><Swords size={16} className="text-blue-400"/> {scrim.mode}</div>
                       </div>
                       <div className="col-span-2 bg-slate-950/50 p-2 rounded text-xs text-slate-400 border border-slate-800/50 flex items-start gap-2">
                          <MessageSquare size={12} className="mt-0.5 shrink-0"/> {scrim.comment}
                       </div>
                    </div>

                    {/* Action */}
                    <div className="w-full md:w-auto flex flex-col items-center justify-center gap-2 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                      {isMine ? (
                         <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleViewApplicants(scrim.applicants)}>
                                <span className="text-xs font-bold text-white">申し込み</span>
                                <span className="text-xs bg-lime-400 text-black font-bold px-2 rounded-full">{applicantCount}</span>
                             </div>
                            <Button danger size="sm" onClick={() => onDeleteScrim(scrim.id)} className="w-full">
                              <Trash2 size={14} /> 削除する
                            </Button>
                         </div>
                      ) : (
                         scrim.status === "募集中" ? (
                           <button 
                             onClick={() => onApplyScrim(scrim.id)}
                             disabled={scrim.applied}
                             className={`font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto text-sm flex items-center justify-center gap-2 ${scrim.applied ? 'bg-slate-800 text-slate-500 cursor-default' : 'bg-lime-400 hover:bg-lime-300 text-black shadow-lg shadow-lime-400/10'}`}
                           >
                             {scrim.applied ? <><CheckCircle size={16}/> 申し込み済</> : <><Swords size={16}/> 対戦を申し込む</>}
                           </button>
                         ) : (
                           <button disabled className="bg-slate-800 text-slate-500 font-bold px-8 py-3 rounded-lg text-sm w-full md:w-auto cursor-not-allowed">募集終了</button>
                         )
                      )}
                      {!isMine && scrim.applied && <span className="text-[10px] text-lime-400">ホストからの承認待ち</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800"><Search size={32} className="mx-auto mb-4 text-slate-600"/><p className="text-slate-500">現在、スクリム募集はありません</p><button onClick={() => setIsModalOpen(true)} className="text-lime-400 text-sm mt-2 hover:underline">最初の募集を作成する</button></div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isModalOpen && <CreateScrimModal currentUser={currentUser} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />}
        {isApplicantsModalOpen && <ApplicantsListModal applicants={currentApplicants} onClose={() => setIsApplicantsModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

// 3. Loadout View (Photo Gallery Style)
const LoadoutView = ({ currentUser, loadouts, onAddLoadout, onDeleteLoadout }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">メタロードアウト共有</h2>
          <p className="text-slate-400 text-sm">スクリーンショットで最強カスタムをシェアしよう</p>
        </div>
        <Button primary size="sm" onClick={() => setIsModalOpen(true)}><ImageIcon size={18}/> 画像を投稿</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loadouts.length > 0 ? (
          loadouts.map((item) => {
            const isMine = item.author === currentUser;
            return (
              <div key={item.id} className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-lime-400 transition-all cursor-pointer relative">
                <div className={`aspect-[4/3] ${item.imageColor || 'bg-slate-800'} relative flex items-center justify-center overflow-hidden`}>
                   {item.image ? (
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                   ) : (
                     <ImageIcon size={48} className="text-white/20" />
                   )}
                   
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      {!isMine && <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">詳細を見る</span>}
                      {isMine && (
                        <Button danger size="sm" onClick={(e) => { e.stopPropagation(); onDeleteLoadout(item.id); }}>
                          <Trash2 size={14}/> 削除
                        </Button>
                      )}
                   </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm mb-1 truncate">{item.title}</h3>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                     <span>by {item.author}</span>
                     <div className="flex items-center gap-1 text-pink-400"><Heart size={12} fill="currentColor"/> {item.likes}</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <ImageIcon size={32} className="mx-auto mb-4 text-slate-600"/>
            <p className="text-slate-500">まだ投稿がありません</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateLoadoutModal 
            currentUser={currentUser} 
            onClose={() => setIsModalOpen(false)} 
            onSubmit={(newLoadout) => { onAddLoadout(newLoadout); setIsModalOpen(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// 4. TOURNAMENT / EVENT VIEW
const TournamentView = ({ currentUser, events, onAddEvent, onJoinEvent, onDeleteEvent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (newEvent) => {
    onAddEvent(newEvent);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Trophy className="text-yellow-500" /> 大会・イベント情報</h2>
          <p className="text-slate-400 text-sm mt-1">コミュニティ大会から交流会まで</p>
        </div>
        <Button primary onClick={() => setIsModalOpen(true)} className="shadow-yellow-500/10">
          <Plus size={20} /> イベントを作成
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* Featured / Large Card for the first event if exists */}
        {events.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-900/40 to-black border border-yellow-500/30 p-8">
             <div className="absolute top-0 right-0 p-4">
               <span className="bg-yellow-500 text-black px-3 py-1 rounded font-bold text-xs">注目</span>
             </div>
             <div className="text-yellow-500 text-sm font-bold mb-1">{events[0].type}</div>
             <h3 className="text-3xl font-black text-white mb-2 italic">{events[0].name}</h3>
             <p className="text-yellow-100/80 mb-6 max-w-lg">{events[0].desc || "詳細はクリックして確認してください。"}</p>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-sm">
               <div className="bg-black/40 p-3 rounded border border-yellow-500/20"><div className="text-yellow-500 text-xs">開催日時</div><div className="font-bold text-white">{events[0].date}</div></div>
               <div className="bg-black/40 p-3 rounded border border-yellow-500/20"><div className="text-yellow-500 text-xs">主催</div><div className="font-bold text-white">{events[0].host}</div></div>
             </div>
             
             {events[0].host === currentUser ? (
               <div className="flex items-center gap-4">
                 <span className="text-yellow-500 font-bold text-sm">投稿済み (あなた)</span>
                 <Button danger size="sm" onClick={() => onDeleteEvent(events[0].id)}><Trash2 size={16}/> 削除する</Button>
               </div>
             ) : (
               <Button 
                 onClick={() => onJoinEvent(events[0].id)}
                 disabled={events[0].joined}
                 className={`${events[0].joined ? 'bg-slate-800 text-slate-500' : 'bg-yellow-500 text-black border-none hover:bg-yellow-400'}`}
               >
                 {events[0].joined ? 'エントリー済み' : 'エントリーする'}
               </Button>
             )}
          </div>
        )}

        {/* Regular Events List */}
        <h3 className="text-lg font-bold text-slate-400 mt-8 mb-4 border-b border-slate-800 pb-2">新着イベント</h3>
        {events.length > 1 ? (
          events.slice(1).map((event) => {
            const isMine = event.host === currentUser;
            return (
              <div key={event.id} className="bg-slate-900 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between border border-slate-800 hover:border-slate-600 transition-all gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-slate-800 w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-white border border-slate-700 shrink-0">
                     <span className="text-xs text-slate-500 uppercase">{new Date(event.date).getMonth()+1 || 12}月</span>
                     <span className="text-xl">{new Date(event.date).getDate() || 15}</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded inline-block mb-1 border border-slate-800">{event.type}</div>
                    <div className="font-bold text-white text-lg">{event.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1"><Users size={12}/> 主催: {event.host}</span>
                    </div>
                  </div>
                </div>
                
                {isMine ? (
                   <Button danger size="sm" onClick={() => onDeleteEvent(event.id)} className="w-full md:w-auto">
                     <Trash2 size={14}/> 削除
                   </Button>
                ) : (
                  <button 
                    onClick={() => onJoinEvent(event.id)}
                    disabled={event.joined}
                    className={`w-full md:w-auto px-6 py-2 rounded-lg font-bold text-sm transition-colors ${event.joined ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-white hover:bg-white hover:text-black border border-slate-700'}`}
                  >
                     {event.joined ? '参加予定' : '詳細・参加'}
                  </button>
                )}
              </div>
            );
          })
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <Calendar size={32} className="mx-auto mb-4 text-slate-600"/>
            <p className="text-slate-500">現在、イベント情報はありません</p>
          </div>
        ) : null}
      </div>
      
      <AnimatePresence>
        {isModalOpen && <CreateEventModal currentUser={currentUser} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />}
      </AnimatePresence>
    </div>
  );
};

// --- Landing Page View (Home) ---
const LandingPage = ({ onNavigate }) => (
  <>
    <div className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <span className="text-lime-400 font-bold tracking-widest text-xs border border-lime-400/30 px-3 py-1 rounded-full bg-lime-400/10">WEB APP VERSION 1.8</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter">
          競技シーンを、<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">もっと身近に。</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-10 leading-relaxed">
          チーム管理、スクリム募集、戦績分析。CoD Mobile競技勢に必要なすべてをブラウザ上で。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button primary onClick={() => onNavigate('matching')}><Users size={20}/> チームメンバー募集</Button>
          <Button onClick={() => onNavigate('scrims')}><Swords size={20}/> スクリムを探す</Button>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime-500/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-6">
        <div onClick={() => onNavigate('loadouts')} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-lime-400 cursor-pointer group transition-all">
          <Zap className="text-yellow-400 mb-4 group-hover:scale-110 transition-transform" size={32}/>
          <h3 className="text-xl font-bold text-white mb-2">メタロードアウト</h3>
          <p className="text-slate-400 text-sm">スクリーンショットで最強カスタムをシェア。</p>
        </div>
        <div onClick={() => onNavigate('tournaments')} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-lime-400 cursor-pointer group transition-all">
          <Trophy className="text-lime-400 mb-4 group-hover:scale-110 transition-transform" size={32}/>
          <h3 className="text-xl font-bold text-white mb-2">大会情報</h3>
          <p className="text-slate-400 text-sm">今週末開催の大会にエントリー。</p>
        </div>
      </div>
    </div>
  </>
);

// --- Main Layout ---

// src/App.jsx の export default function App() { ... } の中身をこれに置き換え

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // --- 1. ユーザープロフィールのDB化 (LocalStorage + Firestore) ---
  const [userId, setUserId] = useState(null); // ブラウザごとのID
  const [userProfile, setUserProfile] = useState({
    name: "Guest",
    rank: "ルーキー",
    avatar: null,
    gameName: "",
    parallelName: "",
    discordName: "",
    twitterName: ""
  });

  // 初期化：ID生成とプロフィールの取得
  useEffect(() => {
    const initUser = async () => {
      // 1. ブラウザに保存されたIDがあるか確認
      let currentId = localStorage.getItem('gjc_user_id');
      
      // なければ新規IDを作成して保存
      if (!currentId) {
        currentId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('gjc_user_id', currentId);
      }
      setUserId(currentId);

      // 2. FirestoreからそのIDのプロフィールを取得
      const userDocRef = doc(db, "users", currentId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        // データがあればセット
        setUserProfile(userSnap.data());
      } else {
        // データがなければ初期データを作成して保存
        const initialProfile = {
          name: "Player_" + currentId.substr(-4),
          rank: "ルーキー",
          avatar: null,
          createdAt: new Date()
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);
      }
    };

    initUser();
  }, []);

  // プロフィール更新処理 (画像アップロード対応)
  const handleUpdateProfile = async (newProfile) => {
    if (!userId) return;

    try {
      let avatarUrl = newProfile.avatar;

      // 画像が変更されている場合（Base64形式なら）、Storageにアップロード
      if (newProfile.avatar && newProfile.avatar.startsWith('data:image')) {
        const imageRef = ref(storage, `avatars/${userId}_${Date.now()}`);
        await uploadString(imageRef, newProfile.avatar, 'data_url');
        avatarUrl = await getDownloadURL(imageRef);
      }

      const updatedData = {
        ...newProfile,
        avatar: avatarUrl // URLに置き換え
      };

      // Firestoreに保存
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, updatedData);

      // 画面の表示も更新
      setUserProfile(updatedData);
      setIsProfileModalOpen(false);
      alert("プロフィールを更新しました！");

    } catch (e) {
      console.error("Profile update failed: ", e);
      alert("更新に失敗しました");
    }
  };


  // --- 2. その他のデータ (募集・スクリムなど) の取得 ---
  
  const [recruitmentPosts, setRecruitmentPosts] = useState([]);
  const [scrimPosts, setScrimPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadouts, setLoadouts] = useState([]);

  // 募集リスト
  useEffect(() => {
    const q = query(collection(db, "recruitments"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setRecruitmentPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // スクリムリスト
  useEffect(() => {
    const q = query(collection(db, "scrims"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setScrimPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // イベントリスト
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // ロードアウト
  useEffect(() => {
    const q = query(collection(db, "loadouts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setLoadouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);


  // --- 3. アクションハンドラ ---

  // メンバー募集 追加
  const addPost = async (newPost) => {
    try {
      const { id, ...postData } = newPost;
      await addDoc(collection(db, "recruitments"), {
        ...postData,
        host: userProfile.name, // 投稿者名を現在のプロフィールで上書き
        hostId: userId, // ユーザーIDも記録しておくと後で便利
        hostAvatar: userProfile.avatar, // アイコンも記録
        createdAt: new Date(),
        timestamp: new Date().toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (e) {
      console.error(e);
      alert("投稿に失敗しました");
    }
  };

  // メンバー募集 削除
  const deletePost = async (id) => {
    if(!window.confirm("本当に削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "recruitments", id));
    } catch (e) { console.error(e); }
  };

  // メンバー募集 参加
  const handleJoinPost = async (id) => {
    try {
      const postRef = doc(db, "recruitments", id);
      await updateDoc(postRef, {
        applicants: arrayUnion(userProfile) // 最新のプロフィール情報で参加
      });
      alert("参加リクエストを送信しました！");
    } catch (e) { console.error(e); }
  };

  // スクリム 追加
  const addScrim = async (newScrim) => {
    try {
      const { id, ...scrimData } = newScrim;
      await addDoc(collection(db, "scrims"), {
        ...scrimData,
        host: userProfile.name,
        hostId: userId,
        createdAt: new Date()
      });
    } catch (e) { console.error(e); }
  };

  // スクリム 削除
  const deleteScrim = async (id) => {
    if(!window.confirm("本当に削除しますか？")) return;
    try { await deleteDoc(doc(db, "scrims", id)); } catch (e) { console.error(e); }
  };

  // スクリム 応募
  const handleApplyScrim = async (id) => {
    try {
      const scrimRef = doc(db, "scrims", id);
      await updateDoc(scrimRef, {
        applied: true,
        applicants: arrayUnion(userProfile)
      });
      alert("対戦申し込みを送信しました！");
    } catch (e) { console.error(e); }
  };

  // イベント 追加
  const addEvent = async (newEvent) => {
    try {
      const { id, ...eventData } = newEvent;
      await addDoc(collection(db, "events"), {
        ...eventData,
        host: userProfile.name,
        hostId: userId,
        createdAt: new Date()
      });
    } catch (e) { console.error(e); }
  };

  // イベント 削除
  const deleteEvent = async (id) => {
    if(!window.confirm("本当に削除しますか？")) return;
    try { await deleteDoc(doc(db, "events", id)); } catch (e) { console.error(e); }
  };

  // イベント 参加
  const handleJoinEvent = async (id) => {
    try {
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, { joined: true }); // 簡易実装
      alert("エントリーしました！");
    } catch (e) { console.error(e); }
  };

  // ロードアウト 追加
  const addLoadout = async (newLoadout) => {
    try {
      let imageUrl = null;
      if (newLoadout.image && newLoadout.image.startsWith('data:image')) {
        const imageRef = ref(storage, `loadouts/${userId}_${Date.now()}`);
        await uploadString(imageRef, newLoadout.image, 'data_url');
        imageUrl = await getDownloadURL(imageRef);
      }

      const { id, ...loadoutData } = newLoadout;
      await addDoc(collection(db, "loadouts"), {
        ...loadoutData,
        image: imageUrl,
        author: userProfile.name, // 投稿者名
        authorId: userId,
        createdAt: new Date()
      });
    } catch (e) {
      console.error(e);
      alert("投稿に失敗しました");
    }
  };

  // ロードアウト 削除
  const deleteLoadout = async (id) => {
    if(!window.confirm("本当に削除しますか？")) return;
    try { await deleteDoc(doc(db, "loadouts", id)); } catch (e) { console.error(e); }
  };


  // --- 4. ナビゲーション定義 ---
  const navItems = [
    { id: 'home', label: 'ホーム', icon: <Target size={18}/> },
    { id: 'matching', label: 'メンバー募集', icon: <Users size={18}/> },
    { id: 'scrims', label: 'スクリム', icon: <Swords size={18}/> },
    { id: 'loadouts', label: 'ロードアウト', icon: <Zap size={18}/> },
    { id: 'tournaments', label: '大会情報', icon: <Trophy size={18}/> },
  ];

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center text-black"><Target size={20} /></div>GJC<span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 ml-1 font-normal tracking-normal border border-slate-700">WEB</span>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-slate-800/50">
            {navItems.map((item) => <button key={item.id} onClick={() => setActiveView(item.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeView === item.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>{item.icon}{item.label}</button>)}
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsProfileModalOpen(true)}
            >
               <div className="text-right">
                 <div className="text-xs font-bold text-white">{userProfile.name}</div>
                 <div className="text-[10px] text-lime-400">{userProfile.rank}</div>
               </div>
               <div className="w-8 h-8 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-800">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-lime-400 to-green-500"></div>
                  )}
               </div>
            </div>
            
            <button className="md:hidden text-white p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden">
            <div className="flex flex-col p-4 gap-2">
              <button onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="p-3 rounded-lg text-left font-bold flex items-center gap-3 bg-slate-800 text-white mb-2">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700 border border-slate-600">
                  {userProfile.avatar ? <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-tr from-lime-400 to-green-500"></div>}
                </div>
                プロフィール設定
              </button>
              {navItems.map((item) => <button key={item.id} onClick={() => { setActiveView(item.id); setIsMenuOpen(false); }} className={`p-3 rounded-lg text-left font-medium flex items-center gap-3 ${activeView === item.id ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>{item.icon} {item.label}</button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeView} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="min-h-full">
            {activeView === 'home' && <LandingPage onNavigate={setActiveView} />}
            {activeView === 'matching' && <RecruitmentBoardView currentUser={userProfile.name} posts={recruitmentPosts} onAddPost={addPost} onJoinPost={handleJoinPost} onDeletePost={deletePost} />}
            {activeView === 'scrims' && <ScrimView currentUser={userProfile.name} scrims={scrimPosts} onAddScrim={addScrim} onApplyScrim={handleApplyScrim} onDeleteScrim={deleteScrim} />}
            {activeView === 'loadouts' && <LoadoutView currentUser={userProfile.name} loadouts={loadouts} onAddLoadout={addLoadout} onDeleteLoadout={deleteLoadout} />}
            {activeView === 'tournaments' && <TournamentView currentUser={userProfile.name} events={events} onAddEvent={addEvent} onJoinEvent={handleJoinEvent} onDeleteEvent={deleteEvent} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && <ProfileModal profile={userProfile} onClose={() => setIsProfileModalOpen(false)} onSave={handleUpdateProfile} />}
      </AnimatePresence>
    </div>
  );
}