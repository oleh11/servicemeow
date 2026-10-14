import fs from "node:fs";

let ADMIN_PW = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "admin123";
let EMP_PW = process.env.EMPLOYEE_PASSWORD || process.env.SEED_DEFAULT_PASSWORD || "ServiceMeow!2026";

if (fs.existsSync("./.verify-creds")) {
  const parts = fs.readFileSync("./.verify-creds", "utf8").trim().split(/\s+/);
  if (parts.length >= 2) {
    [ADMIN_PW, EMP_PW] = parts;
  }
}

const B = process.env.APP_URL || "http://localhost:3000";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function req(method, path, { cookie, body, headers = {} } = {}) {
  const r = await fetch(B + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  try {
    json = await r.json();
  } catch {}
  return { status: r.status, json, setCookie: r.headers.get("set-cookie") };
}

async function login(email, password) {
  const r = await req("POST", "/api/auth/login", { body: { email, password } });
  const c = r.setCookie?.match(/servicemeow_session=[^;]+/)?.[0];
  return { ...r, cookie: c, user: r.json?.user };
}

async function runE2ESecurityTests() {
  console.log(`\n--- Running E2E Security Tests against ${B} ---\n`);

  // --- unauthenticated
  check("unauthenticated API call -> 401", (await req("GET", "/api/now/users")).status === 401);
  check(
    "persona (passwordless) login refused in production",
    (await req("POST", "/api/auth/login", { body: { personaId: "admin@servicemeow.io" } })).status === 403
  );

  // --- employee attacks
  const emp = await login("alex.chen@servicemeow.io", EMP_PW);
  if (emp.cookie) {
    check("employee can log in with valid credentials", !!emp.cookie, `status ${emp.status}`);
    const users = await req("GET", "/api/now/table/sys_user", { cookie: emp.cookie });
    check(
      "sys_user list leaks no passwordHash",
      users.status === 200 &&
        !JSON.stringify(users.json).includes("passwordHash") &&
        !JSON.stringify(users.json).includes("$2"),
      `status ${users.status}`
    );
    const me = await req("GET", "/api/auth/me", { cookie: emp.cookie });
    check("/api/auth/me leaks no passwordHash", !JSON.stringify(me.json).includes("passwordHash"));

    const esc = await req("PATCH", `/api/now/table/sys_user/${emp.user.id}`, {
      cookie: emp.cookie,
      body: { role: "admin", roles: "admin" },
    });
    check("employee self-promote via table API (sys_user PATCH) -> 403", esc.status === 403, `status ${esc.status}`);

    const groups = await req("GET", "/api/now/table/sys_user_group", { cookie: emp.cookie });
    const g = (groups.json?.result || [])[0];
    if (g) {
      check(
        "employee edit group roles (sys_user_group PATCH) -> 403",
        (
          await req("PATCH", `/api/now/table/sys_user_group/${g.sys_id || g.id}`, {
            cookie: emp.cookie,
            body: { roles: "admin" },
          })
        ).status === 403
      );
      check(
        "employee add self to group (sys_user_grmember POST) -> 403",
        (
          await req("POST", "/api/now/table/sys_user_grmember", {
            cookie: emp.cookie,
            body: { user_id: emp.user.id, group_id: g.sys_id || g.id },
          })
        ).status === 403
      );
    }
    const empProd = await req("POST", "/api/now/producers", {
      cookie: emp.cookie,
      body: { name: "x", shortDescription: "x", targetTable: "incident", producerScript: "1" },
    });
    check("employee create record producer (script) -> 403", empProd.status === 403, `status ${empProd.status}`);
    check(
      "spoofed x-auth-role: admin header ignored",
      (
        await req("POST", "/api/now/scheduled-jobs", {
          cookie: emp.cookie,
          headers: { "x-auth-role": "admin", "x-auth-user-id": "x" },
          body: { name: "x", script: "1" },
        })
      ).status === 403
    );
    check(
      "employee create user -> 403",
      (await req("POST", "/api/now/users", { cookie: emp.cookie, body: { name: "x", email: "x@x.io", role: "admin" } }))
        .status === 403
    );
  }

  // --- admin: sandbox escape payloads must not reach Node
  const adm = await login("admin@servicemeow.io", ADMIN_PW);
  if (adm.cookie) {
    check("admin login with valid credentials", !!adm.cookie, `status ${adm.status}`);
    const ESC =
      "const c='constr'+'uctor'; let v; try { v = Object[c][c]('return typeof process')(); } catch(e) { v = 'threw:' + e.message; }";
    const prod = await req("POST", "/api/now/producers", {
      cookie: adm.cookie,
      body: {
        name: "Escape probe",
        shortDescription: "probe",
        targetTable: "incident",
        active: true,
        producerScript: ESC + " current.short_description = 'probe:' + v;",
      },
    });
    check("admin can create record producer", prod.status < 300, `status ${prod.status}`);
    const pid = prod.json?.result?.id;

    if (emp.cookie && pid) {
      const sub = await req("POST", `/api/now/producers/${pid}/submit`, {
        cookie: emp.cookie,
        body: { variables: {} },
      });
      const subTxt = JSON.stringify(sub.json);
      const m = subTxt.match(/probe:[^"]*/);
      check("employee can still submit producer", sub.status < 300, `status ${sub.status}`);
      check(
        "producer script ran in sandbox AND escape saw no Node process",
        !!m && !m[0].includes("object"),
        m ? m[0] : subTxt.slice(0, 200)
      );
    }

    const job = await req("POST", "/api/now/scheduled-jobs", {
      cookie: adm.cookie,
      body: {
        name: "Escape job",
        runIntervalMinutes: 999,
        active: false,
        script: ESC + " log('escape=' + v); log('sum=' + (2+3)); return 'done';",
      },
    });
    const jid = job.json?.result?.id;
    if (jid) {
      const run = await req("POST", `/api/now/scheduled-jobs/${jid}/run`, { cookie: adm.cookie });
      check(
        "scheduled job runs, host log() callback works",
        /sum=5/.test(run.json?.log || ""),
        (run.json?.log || "").replace(/\n/g, " | ")
      );
      check("scheduled job escape saw no Node process", !/escape=object/.test(run.json?.log || ""));
      await req("DELETE", `/api/now/scheduled-jobs/${jid}`, { cookie: adm.cookie });
    }

    if (pid) {
      await req("DELETE", `/api/now/producers/${pid}`, { cookie: adm.cookie });
    }

    // --- stale role: demotion takes effect on next request with same token
    const nu = await req("POST", "/api/now/users", {
      cookie: adm.cookie,
      body: { name: "Temp Admin", email: `temp${Date.now()}@servicemeow.io`, role: "admin" },
    });
    if (nu.json?.temporaryPassword) {
      check(
        "admin create user without password returns temporaryPassword",
        !!nu.json?.temporaryPassword && !JSON.stringify(nu.json.result).includes("passwordHash")
      );
      const ta = await login(nu.json.result.email, nu.json.temporaryPassword);
      check(
        "temp admin has admin API access",
        (await req("GET", "/api/now/scheduled-jobs", { cookie: ta.cookie })).status === 200
      );
      await req("PATCH", `/api/now/users/${nu.json.result.id}`, {
        cookie: adm.cookie,
        body: { role: "employee" },
      });
      const after = await req("GET", "/api/now/scheduled-jobs", { cookie: ta.cookie });
      check("demoted user loses admin access immediately (same token)", after.status === 403, `status ${after.status}`);
      await req("DELETE", `/api/now/users/${nu.json.result.id}`, { cookie: adm.cookie });
    }
  }

  const fails = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} passed\n`);
}

runE2ESecurityTests().catch(console.error);
