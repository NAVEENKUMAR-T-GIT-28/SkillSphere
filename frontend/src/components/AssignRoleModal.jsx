import { useState, useEffect, useRef } from "react";
import { AcademicAPI } from "../services/api";
import StudentSearchInput from "./StudentSearchInput";

/**
 * AssignRoleModal — replaces raw MongoDB ObjectID input with a
 * searchable faculty/student picker backed by your existing API.
 */
export default function AssignRoleModal({
  open,
  roleType = "cc",
  onClose,
  onAssign,
  fetchUsers,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scopeLabel, setScopeLabel] = useState("");
  const [mentees, setMentees] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const roleConfig = {
    cc: {
      title: "Assign Class Coordinator",
      searchRole: "faculty",
      searchPlaceholder: "Search faculty by name or email…",
      scopePlaceholder: "e.g. CSE-A 2026",
      scopeLabel: "Class / Section",
    },
    mentor: {
      title: "Assign Mentor",
      searchRole: "faculty",
      searchPlaceholder: "Search faculty by name or email…",
      scopePlaceholder: "e.g. John Doe (student name)",
      scopeLabel: "Mentee Name / ID",
    },
    rep: {
      title: "Assign Class Representative",
      searchRole: "student",
      searchPlaceholder: "Search students by name or roll number…",
      scopePlaceholder: "e.g. CSE-B 2026",
      scopeLabel: "Section",
    },
  };

  const cfg = roleConfig[roleType] ?? roleConfig.cc;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setScopeLabel("");
      setMentees([]);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 80);

      if (roleType === "cc" || roleType === "rep") {
        const fetchClasses = async () => {
          try {
            const { data } = await AcademicAPI.getClasses();
            setClassesList(data || []);
          } catch (err) {
            console.error("Failed to load classes:", err);
            setError("Failed to load classes list.");
          }
        };
        fetchClasses();
      }
    }
  }, [open, roleType]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchUsers(query.trim(), cfg.searchRole);
        setResults(data ?? []);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, cfg.searchRole, fetchUsers]);

  const handleSelect = (user) => {
    setSelected(user);
    setQuery(user.name);
    setResults([]);
  };

  const handleAssign = async () => {
    if (!selected) return setError("Please select a person.");
    
    let finalScopeLabel = scopeLabel.trim();
    let finalStudentId = selected.studentId;

    if (roleType === "mentor") {
      if (mentees.length === 0) return setError("Please select a mentee.");
      finalScopeLabel = mentees[0].name;
      finalStudentId = mentees[0].roll || mentees[0]._id; // roll contains the actual studentId from StudentSearchInput
    } else if (!finalScopeLabel) {
      return setError(`Please enter/select the ${cfg.scopeLabel}.`);
    }

    setError("");
    setSubmitting(true);
    try {
      let scopeData = undefined;
      if (roleType === "cc" || roleType === "rep") {
        const matchedClass = classesList.find(c => c.label === scopeLabel);
        if (matchedClass) {
          scopeData = {
            department: matchedClass.department,
            section: matchedClass.section,
            batch_year: matchedClass.batch_year
          };
        }
      }

      await onAssign({ 
        userId: selected._id, 
        scopeLabel: finalScopeLabel,
        studentId: finalStudentId,
        scopeData
      });
      onClose();
    } catch (e) {
      setError(e?.message ?? "Assignment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {cfg.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search field */}
        <div className="mb-4">
          <label htmlFor="role-search-input" className="block text-sm font-medium text-gray-700 mb-1.5">
            {cfg.searchRole === "faculty" ? "Faculty Member" : "Student"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {loading ? (
                <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              )}
            </div>
            <input
              id="role-search-input"
              role="combobox"
              aria-expanded={results.length > 0 && !selected}
              aria-controls="role-search-results"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              placeholder={cfg.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {selected && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Dropdown results */}
          {results.length > 0 && !selected && (
            <div id="role-search-results" role="listbox" className="mt-1 border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden max-h-52 overflow-y-auto z-10 relative">
              {results.map((user) => (
                <button
                  key={user._id}
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(user)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  {user.department && (
                    <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{user.department}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.trim() && !loading && results.length === 0 && !selected && (
            <p className="mt-2 text-sm text-gray-500 pl-1">
              No {cfg.searchRole === "faculty" ? "faculty" : "students"} found for "{query}"
            </p>
          )}

          {/* Selected chip */}
          {selected && (
            <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {selected.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-900 truncate">{selected.name}</p>
                <p className="text-xs text-blue-600 truncate">{selected.email}</p>
              </div>
              <button
                onClick={() => { setSelected(null); setQuery(""); }}
                className="text-blue-400 hover:text-blue-600 ml-1"
                aria-label="Clear selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Scope label field */}
        <div className="mb-5">
          <label htmlFor="role-scope-input" className="block text-sm font-medium text-gray-700 mb-1.5">
            {cfg.scopeLabel}
          </label>
          {roleType === "cc" || roleType === "rep" ? (
            <select
              id="role-scope-input"
              value={scopeLabel}
              onChange={(e) => setScopeLabel(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Class / Section</option>
              {classesList.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.department} - Section {c.section} ({c.batch_year})
                </option>
              ))}
            </select>
          ) : roleType === "mentor" ? (
            <StudentSearchInput
              selected={mentees}
              onChange={setMentees}
              max={1}
            />
          ) : (
            <input
              id="role-scope-input"
              type="text"
              value={scopeLabel}
              onChange={(e) => setScopeLabel(e.target.value)}
              placeholder={cfg.scopePlaceholder}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={submitting || !selected}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            )}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
