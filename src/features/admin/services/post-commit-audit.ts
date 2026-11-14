export async function runPostCommitAudit(
  record: () => Promise<void>,
  onFailure: (error: unknown) => void,
): Promise<boolean> {
  try {
    await record();
    return true;
  } catch (error) {
    try {
      onFailure(error);
    } catch {
      // A logging failure must not turn an already-committed mutation into a false failure.
    }
    return false;
  }
}
