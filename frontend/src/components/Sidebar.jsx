import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronDown, ChevronRight, Search, LogOut,
  LayoutDashboard, Hotel
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Professional Widescreen 2D Desktop Sidebar Navigation
 * - Clean 2D White Background (#ffffff) with slate borders (#e2e8f0)
 * - Crimson Red Accent Highlights (#dc2626)
 * - Left-aligned text & non-overlapping badge counters
 * - Fixed Widescreen 288px (w-72) layout
 */
const Sidebar = ({
  menuGroups = [],
  activeTab = '',
  onSelectTab,
  title = 'Admin Panel',
  subtitle = 'Super Master Controls',
  badgeText = 'FULL ACCESS',
  mobileOpen = false,
  setMobileOpen = () => {}
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    menuGroups.forEach((group, idx) => {
      initial[group.id || idx] = true;
    });
    return initial;
  });
  const [filterQuery, setFilterQuery] = useState('');

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <aside className="sticky top-0 z-40 h-screen flex flex-col shrink-0 w-72 bg-white border-r border-slate-200 text-slate-800 font-sans">
      
      {/* Sidebar Header */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-200 shrink-0 bg-white">
        <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Hotel className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase truncate">
            {title}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
              {badgeText}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">{subtitle}</span>
          </div>
        </div>
      </div>

      {/* Sidebar Filter Input */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-red-600 focus:bg-white"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Menu Items Scrollable Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {menuGroups.map((group, gIdx) => {
          const groupId = group.id || `group-${gIdx}`;
          const isExpanded = expandedGroups[groupId] !== false || !!filterQuery;

          const filteredItems = group.items.filter(item =>
            !filterQuery ||
            item.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
            (item.subItems && item.subItems.some(sub => sub.label.toLowerCase().includes(filterQuery.toLowerCase())))
          );

          if (filterQuery && filteredItems.length === 0) return null;

          return (
            <div key={groupId} className="space-y-1">
              {/* Group Title Accordion Header */}
              {group.title && (
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="w-full flex items-center justify-between px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    {group.icon && <group.icon className="w-3 h-3 text-red-600" />}
                    {group.title}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* Sub-menu Items */}
              {isExpanded && (
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon || LayoutDashboard;
                    const isActive = activeTab === item.id || item.subItems?.some(s => s.id === activeTab);

                    return (
                      <div key={item.id} className="space-y-0.5">
                        {/* Main Menu Button */}
                        <button
                          onClick={() => {
                            onSelectTab(item.id, item.filter);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                            isActive
                              ? 'bg-red-50 text-red-700 border-l-3 border-l-red-600 border border-red-200/60'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                            <Icon className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'
                            }`} />
                            <span className="truncate text-left">{item.label}</span>
                          </div>

                          {item.badge !== undefined && item.badge !== null && (
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {/* Nested Sub-Menu List */}
                        {item.subItems && item.subItems.length > 0 && (
                          <div className="ml-5 pl-2 border-l border-slate-200 space-y-1 py-1">
                            {item.subItems.map((sub) => {
                              const isSubActive = activeTab === sub.id && (!sub.filter || sub.filterActive);
                              const SubIcon = sub.icon || ChevronRight;

                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => {
                                    onSelectTab(sub.id, sub.filter);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all text-left ${
                                    isSubActive
                                      ? 'bg-red-100/60 text-red-700 font-bold border border-red-200'
                                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate flex-1 pr-1">
                                    <SubIcon className={`w-3 h-3 ${isSubActive ? 'text-red-600' : 'text-slate-400'}`} />
                                    <span className="truncate text-left">{sub.label}</span>
                                  </div>
                                  {sub.badge !== undefined && sub.badge !== null && (
                                    <span className="shrink-0 text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                                      {sub.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar User Profile Card Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-red-50 border border-red-200 flex items-center justify-center font-bold text-red-600 text-xs shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">@{user?.username || 'admin'}</div>
              <div className="text-[10px] text-slate-500 font-medium uppercase truncate">{user?.role || 'SUPER_ADMIN'}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
