import { useEffect, useRef, useState } from "react";
import { tabsType } from "../../../utils/type";

export default function Card({
  tabs,
  activeTab,
  brandCount,
  supplierCount,
  categoryCount,
  onClick,
}: {
  tabs: tabsType[];
  activeTab: string;
  brandCount?: number;
  supplierCount?: number;
  categoryCount?: number;
  onClick: (tab: tabsType) => () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const updateScrollState = (el: HTMLDivElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScroll({
      left: scrollLeft > 4,
      right: scrollLeft < scrollWidth - clientWidth - 4,
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) updateScrollState(el);
  }, [tabs]);

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="batch-tabs-wrap">
      {/* Left fade hint — visible only when there are tabs hidden to the left */}
      {canScroll.left && <div className="batch-tabs-fade-left" />}

      {/* Right fade hint — visible only when there are tabs hidden to the right */}
      {canScroll.right && <div className="batch-tabs-fade-right" />}

      <div
        ref={scrollRef}
        onScroll={(e) => updateScrollState(e.currentTarget)}
        onWheel={onWheel}
        className="batch-tabs-scroll"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={onClick(tab)}
              className={`batch-tab ${active ? "batch-tab-active" : "batch-tab-inactive"}`}
            >
              {/* <Icon size={16} className={active ? "" : "text-txt2"} /> */}

              <span>{tab.label}</span>

              <span
                className={`batch-tab-count ${active ? "batch-tab-count-active" : "batch-tab-count-inactive"}`}
              >
                {tab.id === "brands"
                  ? (brandCount ?? 0)
                  : tab.id === "suppliers"
                    ? (supplierCount ?? 0)
                    : (categoryCount ?? 0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
