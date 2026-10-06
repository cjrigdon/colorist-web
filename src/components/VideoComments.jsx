import React, { useCallback, useEffect, useRef, useState } from 'react';
import { authAPI, youtubeCommentsAPI } from '../services/api';
import { setPostAuthRedirect } from '../utils/postAuthRedirect';

const BRAND = '#ea3663';
const MAX_LENGTH = 10000;
const DRAFT_PREFIX = 'yt_comment_draft:';
const TIMESTAMP_PATTERN = /\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b/g;
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Top' },
  { value: 'time', label: 'Newest' }
];

const timeAgo = (iso) => {
  if (!iso) return '';
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  for (const [unit, size] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
  }
  return 'just now';
};

const formatCount = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(count);
};

const YouTubeLogo = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z" />
    <path fill="#fff" d="M9.6 15.6 15.8 12 9.6 8.4z" />
  </svg>
);

const CommentText = ({ text, onSeek }) => {
  if (!onSeek) {
    return <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{text}</p>;
  }

  const parts = [];
  let lastIndex = 0;
  text.replace(TIMESTAMP_PATTERN, (match, hours, minutes, secs, offset) => {
    if (Number(secs) > 59 || (hours && Number(minutes) > 59)) return match;
    if (offset > lastIndex) parts.push(text.slice(lastIndex, offset));
    const seconds = Number(hours || 0) * 3600 + Number(minutes) * 60 + Number(secs);
    parts.push(
      <button
        key={`${offset}-${match}`}
        type="button"
        onClick={() => onSeek(seconds)}
        className="text-blue-600 hover:underline"
        title="Jump to this moment"
      >
        {match}
      </button>
    );
    lastIndex = offset + match.length;
    return match;
  });
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{parts}</p>;
};

const Comment = ({ comment, onSeek, small = false, children }) => {
  const avatarSize = small ? 'w-6 h-6' : 'w-8 h-8';
  const AuthorTag = comment.author.channel_url ? 'a' : 'span';
  const authorProps = comment.author.channel_url
    ? { href: comment.author.channel_url, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <div className="flex gap-2.5">
      {comment.author.avatar ? (
        <img
          src={comment.author.avatar}
          alt=""
          referrerPolicy="no-referrer"
          className={`${avatarSize} rounded-full flex-shrink-0 bg-slate-200`}
        />
      ) : (
        <div className={`${avatarSize} rounded-full flex-shrink-0 bg-slate-200`} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <AuthorTag {...authorProps} className="text-xs font-semibold text-slate-800 hover:underline truncate">
            {comment.author.name}
          </AuthorTag>
          <span className="text-xs text-slate-500">
            {timeAgo(comment.published_at)}{comment.edited ? ' (edited)' : ''}
          </span>
        </div>
        <CommentText text={comment.text} onSeek={onSeek} />
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          {comment.like_count > 0 && (
            <span className="inline-flex items-center gap-1" title="Likes on YouTube">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {formatCount(comment.like_count)}
            </span>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

const Composer = ({ value, onChange, onSubmit, onCancel, posting, placeholder, submitLabel, autoFocus = false, compact = false }) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    className="space-y-2"
  >
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={MAX_LENGTH}
      rows={compact ? 2 : 3}
      autoFocus={autoFocus}
      onFocus={(e) => {
        const end = e.target.value.length;
        e.target.setSelectionRange(end, end);
      }}
      disabled={posting}
      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 resize-y disabled:bg-slate-50"
    />
    <div className="flex items-center justify-end gap-2">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={posting}
          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancel
        </button>
      )}
      <button
        type="submit"
        disabled={posting || !value.trim()}
        className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
        style={{ backgroundColor: BRAND }}
      >
        {posting ? 'Posting…' : submitLabel}
      </button>
    </div>
  </form>
);

const VideoComments = ({ videoId, onSeek, onClose, className = '' }) => {
  const [order, setOrder] = useState('relevance');
  const [threads, setThreads] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [viewer, setViewer] = useState({ connected: false, can_comment: false });

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyPosting, setReplyPosting] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const requestIdRef = useRef(0);

  useEffect(() => {
    setDraft(sessionStorage.getItem(DRAFT_PREFIX + videoId) || '');
    setReplyingTo(null);
    setExpanded({});
    setPostError(null);
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;
    if (draft) {
      sessionStorage.setItem(DRAFT_PREFIX + videoId, draft);
    } else {
      sessionStorage.removeItem(DRAFT_PREFIX + videoId);
    }
  }, [draft, videoId]);

  const loadPage = useCallback(async (pageToken = null) => {
    const requestId = ++requestIdRef.current;
    pageToken ? setLoadingMore(true) : setLoading(true);
    setError(null);

    try {
      const data = await youtubeCommentsAPI.list(videoId, { order, pageToken });
      if (requestId !== requestIdRef.current) return;

      setViewer(data.viewer || { connected: false, can_comment: false });
      setCommentsDisabled(!!data.comments_disabled);
      setNextPageToken(data.next_page_token || null);
      setThreads((prev) => {
        if (!pageToken) return data.items || [];
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...(data.items || []).filter((t) => !seen.has(t.id))];
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.data?.message || 'Could not load YouTube comments.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [videoId, order]);

  useEffect(() => {
    if (videoId) loadPage();
  }, [videoId, loadPage]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      setPostAuthRedirect(`${window.location.pathname}${window.location.search}`);
      const { url } = await authAPI.getYoutubeConnect();
      window.location.href = url;
    } catch (err) {
      setConnecting(false);
      setPostError(err.data?.message || 'Could not start the YouTube connection. Please try again.');
    }
  };

  // Returns null when the connect prompt that replaces the composer already explains the problem
  const describePostError = (err) => {
    const reason = err.data?.reason;
    if (reason === 'reconnect_required') {
      setViewer((v) => ({ ...v, can_comment: false }));
      setReplyingTo(null);
      return null;
    }
    if (reason === 'comments_disabled') {
      setCommentsDisabled(true);
    }
    if (err.status === 429) {
      return 'You’re commenting quickly. Wait a minute and try again.';
    }
    return err.data?.message || 'Could not post to YouTube. Please try again.';
  };

  const handlePost = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    setPostError(null);
    try {
      const thread = await youtubeCommentsAPI.post(videoId, text);
      setThreads((prev) => [thread, ...prev.filter((t) => t.id !== thread.id)]);
      setDraft('');
    } catch (err) {
      const message = describePostError(err);
      setPostError(message ? { message, reason: err.data?.reason } : null);
    } finally {
      setPosting(false);
    }
  };

  const loadReplies = async (threadId, pageToken = null) => {
    setExpanded((prev) => ({
      ...prev,
      [threadId]: { items: prev[threadId]?.items || [], nextPageToken: prev[threadId]?.nextPageToken || null, open: true, loading: true }
    }));
    try {
      const data = await youtubeCommentsAPI.replies(videoId, threadId, pageToken);
      setExpanded((prev) => {
        const existing = pageToken ? prev[threadId]?.items || [] : [];
        const seen = new Set(existing.map((r) => r.id));
        return {
          ...prev,
          [threadId]: {
            items: [...existing, ...(data.items || []).filter((r) => !seen.has(r.id))],
            nextPageToken: data.next_page_token || null,
            open: true,
            loading: false
          }
        };
      });
    } catch (err) {
      setExpanded((prev) => ({ ...prev, [threadId]: { ...prev[threadId], loading: false, error: err.data?.message || 'Could not load replies.' } }));
    }
  };

  const toggleReplies = (thread) => {
    const state = expanded[thread.id];
    if (state?.open) {
      setExpanded((prev) => ({ ...prev, [thread.id]: { ...prev[thread.id], open: false } }));
    } else if (state?.items?.length) {
      setExpanded((prev) => ({ ...prev, [thread.id]: { ...prev[thread.id], open: true } }));
    } else {
      loadReplies(thread.id);
    }
  };

  // YouTube threads are one level deep: replies to a reply post to the same thread with an @mention
  const startReply = (thread, comment = thread.comment) => {
    const isNested = comment.id !== thread.comment.id;
    const name = comment.author.name || '';
    const mention = isNested && name ? `${name.startsWith('@') ? name : `@${name}`} ` : '';
    setReplyingTo({ threadId: thread.id, commentId: comment.id, authorName: name });
    setReplyDraft(mention);
    setReplyError(null);
  };

  const handleReply = async (thread) => {
    const text = replyDraft.trim();
    if (!text) return;
    setReplyPosting(true);
    setReplyError(null);
    try {
      const reply = await youtubeCommentsAPI.reply(videoId, thread.id, text);
      setThreads((prev) => prev.map((t) => (
        t.id === thread.id
          ? { ...t, reply_count: t.reply_count + 1, replies: [...t.replies, reply] }
          : t
      )));
      setExpanded((prev) => (
        prev[thread.id]?.items?.length
          ? { ...prev, [thread.id]: { ...prev[thread.id], items: [...prev[thread.id].items, reply], open: true } }
          : prev
      ));
      setReplyingTo(null);
      setReplyDraft('');
    } catch (err) {
      const message = describePostError(err);
      setReplyError(message ? { message, reason: err.data?.reason } : null);
    } finally {
      setReplyPosting(false);
    }
  };

  const renderError = (err) => {
    if (!err) return null;
    const message = typeof err === 'string' ? err : err.message;
    return (
      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {message}
        {err.reason === 'channel_required' && (
          <>
            {' '}
            <a href="https://www.youtube.com/create_channel" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              Create a channel
            </a>
          </>
        )}
      </div>
    );
  };

  const connectPrompt = (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-xs text-slate-600 mb-2">
        {viewer.connected
          ? 'Reconnect YouTube to allow commenting. You’ll come right back here.'
          : 'Connect your YouTube account to comment and reply.'}
      </p>
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-60"
      >
        <YouTubeLogo className="w-4 h-4" />
        {connecting ? 'Opening Google…' : viewer.connected ? 'Reconnect YouTube' : 'Connect YouTube to comment'}
      </button>
    </div>
  );

  return (
    <div className={`flex flex-col min-h-0 bg-white ${className}`}>
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <YouTubeLogo />
          <h3 className="text-sm font-semibold text-slate-800 truncate">YouTube comments</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              aria-label="Close comments"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {!commentsDisabled && (
          <div className="px-4 pt-3 pb-3 border-b border-slate-100 space-y-2">
            {viewer.can_comment ? (
              <>
                <Composer
                  value={draft}
                  onChange={setDraft}
                  onSubmit={handlePost}
                  posting={posting}
                  placeholder="Add a public comment…"
                  submitLabel="Comment on YouTube"
                />
                <p className="text-[11px] text-slate-400">Posts publicly on YouTube from your channel.</p>
              </>
            ) : (
              connectPrompt
            )}
            {renderError(postError)}
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center gap-1 px-4 pt-3">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setOrder(option.value)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  order === option.value
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: BRAND }} />
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => loadPage()}
                className="px-3 py-1.5 text-xs text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Try again
              </button>
            </div>
          ) : commentsDisabled ? (
            <p className="text-sm text-slate-500 text-center py-8">Comments are turned off for this video.</p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No comments yet.</p>
          ) : (
            <ul className="space-y-4">
              {threads.map((thread) => {
                const repliesState = expanded[thread.id];
                const showingAll = !!repliesState?.open && repliesState.items.length > 0;
                const visibleReplies = showingAll ? repliesState.items : thread.replies;
                const hasHiddenReplies = thread.reply_count > thread.replies.length;

                const canReply = viewer.can_comment && thread.can_reply;
                const replyButton = (comment) => canReply && (
                  <button
                    type="button"
                    onClick={() => startReply(thread, comment)}
                    className="font-medium text-slate-600 hover:text-slate-900"
                  >
                    Reply
                  </button>
                );
                const replyComposer = (comment) => replyingTo?.threadId === thread.id && replyingTo.commentId === comment.id && (
                  <div className="space-y-2 mt-2">
                    <Composer
                      value={replyDraft}
                      onChange={setReplyDraft}
                      onSubmit={() => handleReply(thread)}
                      onCancel={() => setReplyingTo(null)}
                      posting={replyPosting}
                      placeholder={`Reply to ${replyingTo.authorName}…`}
                      submitLabel="Reply on YouTube"
                      autoFocus
                      compact
                    />
                    {renderError(replyError)}
                  </div>
                );

                return (
                  <li key={thread.id}>
                    <Comment comment={thread.comment} onSeek={onSeek}>
                      {replyButton(thread.comment)}
                    </Comment>

                    <div className="ml-10 mt-2 space-y-3">
                      {replyComposer(thread.comment)}

                      {visibleReplies.length > 0 && (
                        <ul className="space-y-3">
                          {visibleReplies.map((reply) => (
                            <li key={reply.id}>
                              <Comment comment={reply} onSeek={onSeek} small>
                                {replyButton(reply)}
                              </Comment>
                              <div className="ml-8">{replyComposer(reply)}</div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {(hasHiddenReplies || showingAll) && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleReplies(thread)}
                            disabled={repliesState?.loading}
                            className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
                          >
                            {repliesState?.loading
                              ? 'Loading replies…'
                              : showingAll
                                ? 'Show fewer replies'
                                : `View all ${formatCount(thread.reply_count)} replies`}
                          </button>
                          {showingAll && repliesState.nextPageToken && !repliesState.loading && (
                            <button
                              type="button"
                              onClick={() => loadReplies(thread.id, repliesState.nextPageToken)}
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              More replies
                            </button>
                          )}
                        </div>
                      )}
                      {repliesState?.error && <p className="text-xs text-red-600">{repliesState.error}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && !error && nextPageToken && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => loadPage(nextPageToken)}
                disabled={loadingMore}
                className="px-4 py-1.5 text-xs text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Load more comments'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoComments;
