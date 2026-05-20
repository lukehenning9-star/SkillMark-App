"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { TRADES, US_STATES, UNION_STATUS_OPTIONS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

type SearchProfile = Pick<
  Profile,
  "id" | "username" | "full_name" | "avatar_url" | "trade" | "experience_level" | "years_experience" | "city" | "state" | "is_available" | "union_status"
>;

const selectClass =
  "bg-sm-bg border border-border rounded-md px-3 py-2 text-sm text-navy focus:outline-none focus:border-accent transition-all";

const levelLabel: Record<string, string> = {
  apprentice: "Apprentice",
  journeyman: "Journeyman",
  master: "Master",
};

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [trade, setTrade] = useState("");
  const [level, setLevel] = useState("");
  const [state, setState] = useState("");
  const [unionStatus, setUnionStatus] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const runSearch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, trade, experience_level, years_experience, city, state, is_available, union_status")
      .eq("onboarding_complete", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (query.trim()) q = q.ilike("full_name", `%${query.trim()}%`);
    if (trade) q = q.eq("trade", trade);
    if (level) q = q.eq("experience_level", level);
    if (state) q = q.eq("state", state);
    if (unionStatus) q = q.eq("union_status", unionStatus);
    if (availableOnly) q = q.eq("is_available", true);

    const { data } = await q;
    setResults((data ?? []) as SearchProfile[]);
    setLoading(false);
  }, [query, trade, level, state, unionStatus, availableOnly]);

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
  }, [runSearch]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy">Find Trade Workers</h1>
        <p className="text-text-dim text-sm mt-1">
          Search trade professionals by name, skill, location, and availability.
        </p>
      </div>

      <div className="bg-white border border-border rounded-xl p-4 mb-6 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full bg-sm-bg border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <select value={trade} onChange={(e) => setTrade(e.target.value)} className={selectClass}>
            <option value="">All trades</option>
            {TRADES.map((t) => <option key={t}>{t}</option>)}
          </select>

          <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectClass}>
            <option value="">All levels</option>
            <option value="apprentice">Apprentice</option>
            <option value="journeyman">Journeyman</option>
            <option value="master">Master</option>
          </select>

          <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
            <option value="">All states</option>
            {US_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>

          <select value={unionStatus} onChange={(e) => setUnionStatus(e.target.value)} className={selectClass}>
            <option value="">Union status</option>
            {UNION_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>

          <label className="flex items-center gap-2 bg-sm-bg border border-border rounded-md px-3 py-2 cursor-pointer hover:border-border2 transition-colors">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-sm text-navy font-medium whitespace-nowrap">Available only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sm-bg rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-sm-bg rounded w-3/4" />
                  <div className="h-3 bg-sm-bg rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-white border border-border rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p className="font-semibold text-navy text-sm">No workers found</p>
          <p className="text-xs text-text-dim mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-dim mb-3 font-medium uppercase tracking-wide">
            {results.length} worker{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((profile) => (
              <Link
                key={profile.id}
                href={`/${profile.username}`}
                className="bg-white border border-border rounded-xl p-4 hover:shadow-sm hover:border-border2 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-navy-mid rounded-full flex items-center justify-center overflow-hidden shrink-0 relative">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="40px" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate group-hover:text-accent transition-colors">
                      {profile.full_name ?? profile.username}
                    </p>
                    <p className="text-xs text-text-dim truncate">
                      {profile.trade
                        ? `${profile.experience_level ? levelLabel[profile.experience_level] + " " : ""}${profile.trade}`
                        : `@${profile.username}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {(profile.city || profile.state) && (
                        <span className="text-[10px] text-text-dim">
                          {[profile.city, profile.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {profile.is_available && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                          Available
                        </span>
                      )}
                      {profile.union_status && (
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                          {profile.union_status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
