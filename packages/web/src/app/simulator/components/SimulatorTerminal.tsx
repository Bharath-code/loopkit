"use client";

import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import type { SimulatorState, TerminalLine, Action } from "./terminal/state";
import { simulatorReducer, initialState } from "./terminal/state";
import { line, blank, sleep } from "./terminal/animations";
import {
  parseCommand,
  getHandler,
  type CommandContext,
} from "./terminal/commands";

interface Props {
  state: SimulatorState;
  onStateChange: (state: SimulatorState) => void;
  onCommandExecuted: (cmd: string) => void;
  injectedCommand: string | null;
  onInjectedCommandConsumed: () => void;
}

export function SimulatorTerminal({
  state,
  onStateChange,
  onCommandExecuted,
  injectedCommand,
  onInjectedCommandConsumed,
}: Props) {
  const [outputLines, setOutputLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [promptResolve, setPromptResolve] = useState<
    ((value: string) => void) | null
  >(null);
  const [promptQuestion, setPromptQuestion] = useState<string | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineIdRef = useRef(0);

  const addLine = useCallback((line: TerminalLine) => {
    setOutputLines((prev) => [...prev, { ...line, id: ++lineIdRef.current }]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines]);

  // Focus input on click
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Initial welcome message
  useEffect(() => {
    const welcome: TerminalLine[] = [
      {
        id: ++lineIdRef.current,
        text: "LoopKit Simulator v0.1.0",
        color: "text-zinc-500",
      },
      {
        id: ++lineIdRef.current,
        text: "Type 'help' to see available commands, or click a quick command above.",
        color: "text-zinc-500",
      },
      { id: ++lineIdRef.current, text: "", color: "" },
    ];
    setOutputLines(welcome);
  }, []);

  // Handle injected commands from quick buttons
  useEffect(() => {
    if (injectedCommand && !isProcessing) {
      setInputValue(injectedCommand);
      onInjectedCommandConsumed();
      // Execute on next tick so input value is set
      setTimeout(() => {
        executeCommand(injectedCommand);
      }, 50);
    }
  }, [injectedCommand, isProcessing, onInjectedCommandConsumed]);

  const promptUser = useCallback((question: string): Promise<string> => {
    setPromptQuestion(question);
    return new Promise((resolve) => {
      setPromptResolve(() => resolve);
    });
  }, []);

  const executeCommand = useCallback(
    async (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      // Add command to output
      addLine({
        id: ++lineIdRef.current,
        text: `$ ${trimmed}`,
        color: "text-zinc-400",
      });
      setHistory((prev) => [trimmed, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      setInputValue("");

      if (trimmed === "clear") {
        setOutputLines([]);
        return;
      }

      const parsed = parseCommand(trimmed);
      if (!parsed) {
        addLine({
          id: ++lineIdRef.current,
          text: `  Command not found: ${trimmed}`,
          color: "text-red-400",
        });
        addLine({
          id: ++lineIdRef.current,
          text: "  Type 'help' for available commands.",
          color: "text-zinc-500",
        });
        return;
      }

      const handler = getHandler(parsed.name);
      if (!handler) {
        addLine({
          id: ++lineIdRef.current,
          text: `  Command not found: ${trimmed}`,
          color: "text-red-400",
        });
        addLine({
          id: ++lineIdRef.current,
          text: "  Type 'help' for available commands.",
          color: "text-zinc-500",
        });
        return;
      }

      setIsProcessing(true);

      const ctx: CommandContext = {
        state,
        dispatch: (action: Action) => {
          // We need to track state changes
          const newState = simulatorReducer(stateRef.current, action);
          stateRef.current = newState;
          onStateChange(newState);
        },
        addLine,
        promptUser,
      };

      // Use a ref to track state within the command execution
      const stateRef = { current: state };

      try {
        await handler(parsed.args, ctx);
        onCommandExecuted(parsed.name);
      } catch (err) {
        addLine({
          id: ++lineIdRef.current,
          text: `  Error: ${err}`,
          color: "text-red-400",
        });
      } finally {
        setIsProcessing(false);
        setPromptQuestion(null);
        setPromptResolve(null);
      }
    },
    [state, addLine, onStateChange, onCommandExecuted, promptUser],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (promptResolve) {
          // We're in prompt mode — resolve the promise
          const value = inputValue || promptQuestion || "";
          promptResolve(value);
          if (inputValue) {
            addLine({
              id: ++lineIdRef.current,
              text: inputValue,
              color: "text-cyan-400",
            });
          }
          setInputValue("");
          setPromptQuestion(null);
          setPromptResolve(null);
        } else {
          executeCommand(inputValue);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = Math.min(historyIndex + 1, history.length - 1);
          setHistoryIndex(newIndex);
          setInputValue(history[newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInputValue(history[newIndex]);
        } else {
          setHistoryIndex(-1);
          setInputValue("");
        }
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setOutputLines([]);
      }
    },
    [
      inputValue,
      promptResolve,
      promptQuestion,
      addLine,
      executeCommand,
      history,
      historyIndex,
    ],
  );

  return (
    <div
      className="terminal glow-violet flex flex-col"
      style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}
    >
      {/* Terminal header */}
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-amber-500/70" />
        <div className="terminal-dot bg-emerald-500/70" />
        <span className="ml-3 text-xs text-zinc-500">loopkit — simulator</span>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="terminal-body flex-1 overflow-y-auto cursor-text"
        onClick={focusInput}
      >
        {outputLines.map((l) => (
          <div
            key={l.id}
            className={`${l.color} whitespace-pre-wrap break-all`}
            style={{ minHeight: l.text === "" ? "1.2em" : undefined }}
          >
            {l.text || "\u00A0"}
          </div>
        ))}

        {/* Spinner placeholder - managed by command handlers via line updates */}

        {/* Input line */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-zinc-500 shrink-0">
            {promptQuestion ? "?" : "$"}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isProcessing
                ? "Processing..."
                : promptQuestion
                  ? promptQuestion
                  : "Type a command..."
            }
            disabled={isProcessing && !promptResolve}
            className="simulator-input"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
