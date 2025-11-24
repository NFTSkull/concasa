export type LeadAction = {
  timestamp: string;
  nombre: string;
  origenCTA: string;
};

const actionLog: LeadAction[] = [];

export const logLeadAction = (entry: LeadAction) => {
  actionLog.push(entry);
  if (process.env.NODE_ENV !== "production") {
    // Mantener trazabilidad simple en desarrollo sin exponer datos sensibles.
    // eslint-disable-next-line no-console
    console.info("[action_log]", entry);
  }
};

export const getActionLog = () => actionLog;

