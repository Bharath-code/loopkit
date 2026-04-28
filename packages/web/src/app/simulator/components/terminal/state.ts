export type Phase =
  | "idle"
  | "init"
  | "develop"
  | "deliver"
  | "learn"
  | "iterate";

export type TaskStatus = "open" | "done" | "snoozed";

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: string;
  closedAt?: string;
}

export interface Project {
  name: string;
  slug: string;
  answers: Record<string, string>;
  scores: { icp: number; problem: number; mvp: number; overall: number };
  riskiestAssumption: string;
  validationAction: string;
  brief: string;
}

export interface ShipEntry {
  date: string;
  whatShipped: string;
}

export interface LoopEntry {
  week: number;
  score: number;
  tasksCompleted: number;
  tasksTotal: number;
  oneThing: string;
  bipPost: string;
}

export interface PulseCluster {
  label: string;
  count: number;
  pattern: string;
  quotes: string[];
}

export interface TerminalLine {
  id: number;
  text: string;
  color: string;
  isHtml?: boolean;
}

export interface SimulatorState {
  phase: Phase;
  project: Project | null;
  tasks: Task[];
  ships: ShipEntry[];
  pulseResponses: string[];
  pulseClusters: PulseCluster[] | null;
  loops: LoopEntry[];
  week: number;
  streak: number;
  templateUsed: string | null;
  nextTaskId: number;
}

export const initialState: SimulatorState = {
  phase: "idle",
  project: null,
  tasks: [],
  ships: [],
  pulseResponses: [],
  pulseClusters: null,
  loops: [],
  week: 1,
  streak: 0,
  templateUsed: null,
  nextTaskId: 1,
};

export type Action =
  | { type: "SET_PHASE"; phase: Phase }
  | { type: "SET_PROJECT"; project: Project }
  | { type: "SET_TEMPLATE"; template: string }
  | { type: "ADD_TASKS"; tasks: { title: string; createdAt: string }[] }
  | { type: "COMPLETE_TASK"; id: number }
  | { type: "ADD_SHIP"; ship: ShipEntry }
  | { type: "ADD_PULSE_RESPONSES"; responses: string[] }
  | { type: "SET_PULSE_CLUSTERS"; clusters: PulseCluster[] }
  | { type: "ADD_LOOP"; loop: LoopEntry }
  | { type: "INCREMENT_WEEK" }
  | { type: "SET_STREAK"; streak: number }
  | { type: "RESET" };

export function simulatorReducer(
  state: SimulatorState,
  action: Action,
): SimulatorState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "SET_PROJECT":
      return { ...state, project: action.project };
    case "SET_TEMPLATE":
      return { ...state, templateUsed: action.template };
    case "ADD_TASKS": {
      const newTasks = action.tasks.map((t, i) => ({
        id: state.nextTaskId + i,
        title: t.title,
        status: "open" as TaskStatus,
        createdAt: t.createdAt,
      }));
      return {
        ...state,
        tasks: [...state.tasks, ...newTasks],
        nextTaskId: state.nextTaskId + action.tasks.length,
      };
    }
    case "COMPLETE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                status: "done" as TaskStatus,
                closedAt: new Date().toISOString().split("T")[0],
              }
            : t,
        ),
      };
    case "ADD_SHIP":
      return { ...state, ships: [...state.ships, action.ship] };
    case "ADD_PULSE_RESPONSES":
      return {
        ...state,
        pulseResponses: [...state.pulseResponses, ...action.responses],
      };
    case "SET_PULSE_CLUSTERS":
      return { ...state, pulseClusters: action.clusters };
    case "ADD_LOOP":
      return {
        ...state,
        loops: [...state.loops, action.loop],
        week: state.week + 1,
        streak: action.loop.score > 0 ? state.streak + 1 : 0,
      };
    case "INCREMENT_WEEK":
      return { ...state, week: state.week + 1 };
    case "SET_STREAK":
      return { ...state, streak: action.streak };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}
