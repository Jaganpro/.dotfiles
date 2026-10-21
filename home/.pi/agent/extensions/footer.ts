// Quiet two-line footer: accented folder, context bar, model on the right.
// Line 1: ~/path ⎇ branch · session   Line 2: ▰▰▰░░ 42% · 1M · auto   ✦ model · thinking
// Written with Pi using the setFooter API from Pi's examples/extensions/custom-footer.ts.
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

const BAR_CELLS = 10;
const GAP = 2;

type UsageColor = "dim" | "warning" | "error";

function formatCwd(cwd: string): string {
	const home = process.env.HOME || process.env.USERPROFILE;
	if (!home) return cwd;
	const resolvedCwd = resolve(cwd);
	const resolvedHome = resolve(home);
	const relativeToHome = relative(resolvedHome, resolvedCwd);
	const insideHome =
		relativeToHome === "" ||
		(relativeToHome !== ".." && !relativeToHome.startsWith(`..${sep}`) && !isAbsolute(relativeToHome));
	if (!insideHome) return cwd;
	return relativeToHome === "" ? "~" : `~${sep}${relativeToHome}`;
}

function formatWindow(count: number): string {
	if (count < 1000) return String(count);
	if (count < 10_000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1_000_000) return `${Math.round(count / 1000)}k`;
	if (count < 10_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
	return `${Math.round(count / 1_000_000)}M`;
}

function formatPercent(percent: number | null): string {
	if (percent === null) return "?";
	if (percent > 0 && percent < 1) return "<1%";
	return `${Math.round(percent)}%`;
}

function usageColor(percent: number | null): UsageColor {
	if (percent === null || percent <= 70) return "dim";
	if (percent > 90) return "error";
	return "warning";
}

function filledCells(percent: number | null): number {
	if (percent === null || percent <= 0) return 0;
	return Math.min(BAR_CELLS, Math.max(1, Math.round(percent / 10)));
}

function sanitizeStatus(text: string): string {
	return text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();
}

function fits(left: string, right: string, width: number): boolean {
	const gap = right ? GAP : 0;
	return visibleWidth(left) + gap + visibleWidth(right) <= width;
}

function place(left: string, right: string, width: number): string {
	const pad = Math.max(right ? GAP : 0, width - visibleWidth(left) - visibleWidth(right));
	return left + " ".repeat(pad) + right;
}

function clip(text: string, width: number, ellipsis: string): string {
	if (width <= 0) return "";
	if (visibleWidth(text) <= width) return text;
	return truncateToWidth(text, width, ellipsis);
}

function colorPath(theme: Theme, cwd: string, basenameOnly: boolean): string {
	const display = formatCwd(cwd);
	const parts = display.split(sep);
	const leaf = parts.pop() || display;
	if (basenameOnly || parts.length === 0) return theme.fg("accent", leaf);
	return theme.fg("dim", `${parts.join(sep)}${sep}`) + theme.fg("accent", leaf);
}

function pathLine(
	theme: Theme,
	cwd: string,
	branch: string | null,
	sessionName: string | undefined,
	basenameOnly: boolean,
	showSession: boolean,
): string {
	let line = colorPath(theme, cwd, basenameOnly);
	if (branch) line += theme.fg("dim", `  ⎇ ${branch}`);
	if (showSession && sessionName) line += theme.fg("dim", ` · ${sessionName}`);
	return line;
}

function barFill(percent: number | null): "accent" | "warning" | "error" | undefined {
	if (percent === null || percent <= 0) return undefined;
	if (percent > 90) return "error";
	if (percent > 70) return "warning";
	return "accent";
}

function contextBar(theme: Theme, percent: number | null): string {
	const filled = filledCells(percent);
	const empty = BAR_CELLS - filled;
	const track = theme.colors.border;
	const fill = barFill(percent);
	const emptyBar = empty > 0 ? theme.style(" ".repeat(empty), { bg: track }) : "";
	if (!fill || filled === 0) return theme.style(" ".repeat(BAR_CELLS), { bg: track });
	return theme.style(" ".repeat(filled), { bg: theme.colors[fill] }) + emptyBar;
}

function joinStats(theme: Theme, percent: number | null, window: number, auto: boolean, showWindow: boolean, showAuto: boolean): string {
	const color = usageColor(percent);
	let line = `${contextBar(theme, percent)}  ${theme.fg(color, formatPercent(percent))}`;
	if (showWindow && window > 0) line += theme.fg("dim", ` · ${formatWindow(window)}`);
	if (showAuto && auto) line += theme.fg("dim", " · auto");
	return line;
}

function modelLine(theme: Theme, modelId: string | undefined, thinking: ThinkingLevel | undefined, showThinking: boolean): string {
	if (!modelId) return theme.fg("dim", "no model");
	let line = `${theme.fg("accent", "✦")} ${theme.style(modelId, { fg: "accent", bold: true })}`;
	if (showThinking && thinking) {
		line += theme.fg("dim", " · ") + theme.getThinkingBorderColor(thinking)(thinking);
	}
	return line;
}

function renderPath(theme: Theme, width: number, cwd: string, branch: string | null, sessionName: string | undefined): string {
	const ellipsis = theme.fg("dim", "…");
	const candidates = [
		pathLine(theme, cwd, branch, sessionName, false, true),
		pathLine(theme, cwd, branch, sessionName, false, false),
		pathLine(theme, cwd, branch, sessionName, true, false),
	];
	for (const line of candidates) {
		if (visibleWidth(line) <= width) return line;
	}
	return clip(candidates[2] ?? "", width, ellipsis);
}

function renderStats(
	theme: Theme,
	width: number,
	percent: number | null,
	window: number,
	auto: boolean,
	modelId: string | undefined,
	thinking: ThinkingLevel | undefined,
	reasoning: boolean,
): string {
	const ellipsis = theme.fg("dim", "…");
	const lefts = [
		joinStats(theme, percent, window, auto, true, true),
		joinStats(theme, percent, window, auto, true, false),
		joinStats(theme, percent, window, auto, false, false),
	];
	const rights = reasoning
		? [modelLine(theme, modelId, thinking, true), modelLine(theme, modelId, thinking, false)]
		: [modelLine(theme, modelId, thinking, false)];

	for (const left of lefts) {
		for (const right of rights) {
			if (fits(left, right, width)) return place(left, right, width);
		}
	}

	const fullestRight = rights[rights.length - 1] ?? "";
	const rightBudget = Math.min(visibleWidth(fullestRight), Math.max(8, Math.floor(width * 0.45)));
	const right = clip(fullestRight, rightBudget, ellipsis);
	const leftWidth = Math.max(0, width - visibleWidth(right) - (right ? GAP : 0));
	const left = clip(lefts[2] ?? "", leftWidth, ellipsis);
	if (!right) return clip(left, width, ellipsis);
	if (!fits(left, right, width)) return clip(`${left} ${right}`, width, ellipsis);
	return place(left, right, width);
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		if (ctx.mode !== "tui") return;

		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsub = footerData.onBranchChange(() => tui.requestRender());
			return {
				dispose: unsub,
				invalidate() {},
				render(width: number): string[] {
					if (width <= 0) return [];
					try {
						const usage = ctx.getContextUsage();
						const lines = [
							renderPath(theme, width, ctx.sessionManager.getCwd(), footerData.getGitBranch(), ctx.sessionManager.getSessionName()),
							renderStats(
								theme,
								width,
								usage?.percent ?? null,
								usage?.contextWindow ?? ctx.model?.contextWindow ?? 0,
								pi.getSettings().compaction?.enabled !== false,
								ctx.model?.id,
								ctx.thinkingLevel ?? pi.getThinkingLevel(),
								ctx.model?.reasoning === true,
							),
						];
						const statuses = Array.from(footerData.getExtensionStatuses().entries())
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([, text]) => sanitizeStatus(text))
							.filter(Boolean);
						if (statuses.length > 0) {
							lines.push(truncateToWidth(statuses.join(" "), width, theme.fg("dim", "…")));
						}
						return lines;
					} catch {
						return [theme.fg("dim", formatCwd(ctx.cwd))];
					}
				},
			};
		});
	});
}
