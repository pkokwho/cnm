import { EventEmitter } from "events";

export interface QueueJob {
  id: string;
  type: string;
  data: any;
}

export type JobHandler = (job: QueueJob) => Promise<void>;

class SimpleQueue extends EventEmitter {
  private queue: QueueJob[] = [];
  private processing = false;
  private handlers: Map<string, JobHandler> = new Map();
  private jobResults: Map<string, { status: "running" | "done" | "error"; error?: string }> = new Map();

  register(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  enqueue(job: QueueJob) {
    this.queue.push(job);
    this.jobResults.set(job.id, { status: "running" });
    this.emit("enqueued", job);
    this.process();
  }

  getStatus(jobId: string): { status: "running" | "done" | "error"; error?: string } | undefined {
    return this.jobResults.get(jobId);
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      const handler = this.handlers.get(job.type);

      if (!handler) {
        this.jobResults.set(job.id, { status: "error", error: `No handler for type: ${job.type}` });
        this.emit("error", job, new Error(`No handler for type: ${job.type}`));
        continue;
      }

      try {
        await handler(job);
        this.jobResults.set(job.id, { status: "done" });
        this.emit("done", job);
      } catch (err: any) {
        this.jobResults.set(job.id, { status: "error", error: err.message });
        this.emit("error", job, err);
      }
    }

    this.processing = false;
  }
}

export const queue = new SimpleQueue();
