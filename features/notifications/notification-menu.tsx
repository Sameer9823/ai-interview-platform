"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { LocalTime } from "@/components/layout/local-time";
import { markNotificationsReadAction } from "./actions";

export interface NotificationItem {
  id: string;
  title: string;
  at: string;
  read: boolean;
}

export function NotificationMenu({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const unread = items.filter((n) => !n.read).length;
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Escape closes and returns focus to the button. A click outside also closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);
  return (
    <div style={{ position: "relative" }} ref={wrap}>
      <button
        ref={trigger}
        className="ib"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg aria-hidden="true">
          <use href="#bell" />
        </svg>
        {unread > 0 && <span className="dot">{unread}</span>}
      </button>
      {open && (
        <div className="pop" role="region" aria-label="Notifications">
          <h3 style={{ fontSize: 16 }}>Notifications</h3>
          <div style={{ marginTop: 12 }}>
            {items.length ? (
              <>
                <ul className="l">
                  {items.slice(0, 8).map((n) => (
                    <li key={n.id}>
                      <span>{n.title}</span>
                      <LocalTime iso={n.at} />
                    </li>
                  ))}
                </ul>
                {unread > 0 && (
                  <button
                    className="btn o s"
                    style={{ marginTop: 16 }}
                    disabled={pending}
                    onClick={() => start(() => markNotificationsReadAction())}
                  >
                    Mark all read
                  </button>
                )}
              </>
            ) : (
              <div className="empty">Nothing yet. Account events will show up here.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
