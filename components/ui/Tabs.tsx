"use client";

import React, { createContext, useContext } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  value,
  onValueChange,
  children,
  className = "",
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange }}>
      <div className={`w-full space-y-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 border-b border-[#E8E8E3] w-full pb-px ${className}`}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function TabTrigger({
  value,
  children,
  badge,
  className = "",
}: TabTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabTrigger must be used within Tabs");
  }

  const isActive = context.activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveTab(value)}
      className={`relative inline-flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer select-none -mb-px ${
        isActive
          ? "text-[#141413] border-b-2 border-[#B8532F]"
          : "text-[#6E6E69] hover:text-[#141413] border-b-2 border-transparent"
      } ${className}`}
    >
      <span>{children}</span>
      {badge && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            isActive
              ? "bg-[#F8EFEA] text-[#9E4323]"
              : "bg-[#F3F3EF] text-[#6E6E69]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabContent({
  value,
  children,
  className = "",
}: TabContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabContent must be used within Tabs");
  }

  if (context.activeTab !== value) return null;

  return (
    <div role="tabpanel" className={`pt-2 ${className}`}>
      {children}
    </div>
  );
}
