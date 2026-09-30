import "server-only";

const MARK = "_$$ND_FUNC$$_";

// Custom serializer that also supports functions, mirroring the real
// node-serialize (CVE-2017-5941) vulnerability pattern.
export function serialize(obj: unknown) {
  return JSON.stringify(obj, function (key, value) {
    if (typeof value === "function") return MARK + value.toString();
    return value;
  });
}

export function deserialize(str: string) {
  return JSON.parse(str, function (key, value) {
    if (typeof value === "string" && value.startsWith(MARK)) {
      const code = value.substring(MARK.length);
      // VULN: Insecure Deserialization -> Remote Code Execution.
      // Cookie content is attacker-controlled and executed with eval().
      // eslint-disable-next-line no-eval
      return eval("(" + code + ")")();
    }
    return value;
  });
}
