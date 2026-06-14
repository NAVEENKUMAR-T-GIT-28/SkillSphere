/**
 * StudentSearchInput
 * A searchable student picker backed by GET /hod/users?search=&role=student.
 * Used in ProjectForm to replace the raw ObjectId input for team members.
 *
 * Props:
 *   selected  — array of { _id, name, roll } student objects already chosen
 *   onChange  — (newArray) => void
 *   max       — max number of team members (default 5)
 */

import { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { UsersAPI } from '../services/api';

export default function StudentSearchInput({ selected = [], onChange, max = 5 }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await UsersAPI.searchUsers(query.trim(), 'student', 8);
        // Filter out already-selected students
        const selectedIds = new Set(selected.map(s => s._id));
        setResults((Array.isArray(data) ? data : []).filter(u => !selectedIds.has(u._id)));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(debounce.current);
  }, [query, selected]);

  const add = (user) => {
    onChange([...selected, { _id: user._id, name: user.name, roll: user.studentId || user._id }]);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const remove = (id) => onChange(selected.filter(s => s._id !== id));

  return (
    <div>
      {/* Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map(s => (
            <span
              key={s._id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-medium"
            >
              {s.name}
              <button
                type="button"
                onClick={() => remove(s._id)}
                className="hover:text-blue-600"
                aria-label={`Remove ${s.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {selected.length < max && (
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {loading
              ? <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              : <Search size={14} className="text-text-muted" />
            }
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search student by name or roll number…"
            className="input-field pl-9 text-sm"
          />

          {results.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-20 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto"
            >
              {results.map(u => (
                <li key={u._id} role="option" aria-selected="false">
                  <button
                    type="button"
                    onMouseDown={() => add(u)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{u.name}</p>
                      <p className="text-xs text-text-muted">{u.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <p className="mt-1.5 text-xs text-text-muted pl-1">No students found for "{query}"</p>
          )}
        </div>
      )}

      {selected.length >= max && (
        <p className="text-xs text-text-muted mt-1">Maximum {max} team members reached.</p>
      )}
    </div>
  );
}
