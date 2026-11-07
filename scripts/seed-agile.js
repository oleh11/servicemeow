const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function seedAgile(dbPath) {
  console.log(`Seeding Agile tables and records at: ${dbPath}`);
  const prisma = new PrismaClient({
    datasourceUrl: 'file:' + dbPath,
  });

  try {
    // 1. Ensure SysDbObject entries exist for Agile tables
    const tables = [
      { name: 'rm_story', label: 'Agile Story [rm_story]', superClass: 'task', description: 'User stories, acceptance criteria, story points and sprint assignments' },
      { name: 'rm_sprint', label: 'Sprint [rm_sprint]', superClass: null, description: 'Agile sprint timeboxes, velocity goals and dates' },
      { name: 'rm_epic', label: 'Agile Epic [rm_epic]', superClass: 'task', description: 'High-level strategic initiatives grouping user stories' },
      { name: 'rm_project', label: 'Project / Release [rm_project]', superClass: 'task', description: 'Enterprise projects and major releases' },
    ];

    for (const t of tables) {
      await prisma.sysDbObject.upsert({
        where: { name: t.name },
        update: { label: t.label, superClass: t.superClass, description: t.description },
        create: { name: t.name, label: t.label, superClass: t.superClass, description: t.description, isCustom: false },
      });
    }

    // 2. Ensure sys_number entries exist for Agile prefixes
    const sysNumbers = [
      { tableName: 'rm_story', prefix: 'STRY', currentNumber: 1008, digits: 7 },
      { tableName: 'rm_sprint', prefix: 'SPNT', currentNumber: 1003, digits: 7 },
      { tableName: 'rm_epic', prefix: 'EPIC', currentNumber: 1004, digits: 7 },
      { tableName: 'rm_project', prefix: 'PRJ', currentNumber: 1002, digits: 7 },
    ];

    for (const sn of sysNumbers) {
      await prisma.sysNumber.upsert({
        where: { tableName: sn.tableName },
        update: { prefix: sn.prefix },
        create: sn,
      });
    }

    // 3. Ensure SysDictionary columns exist for rm_story
    const storyCols = [
      { columnName: 'number', columnLabel: 'Number', columnType: 'string', isReadOnly: true, isMandatory: true },
      { columnName: 'short_description', columnLabel: 'Short Description', columnType: 'string', isReadOnly: false, isMandatory: true },
      { columnName: 'description', columnLabel: 'Description', columnType: 'text', isReadOnly: false, isMandatory: false },
      { columnName: 'story_points', columnLabel: 'Story Points', columnType: 'integer', isReadOnly: false, isMandatory: false },
      { columnName: 'state', columnLabel: 'State', columnType: 'choice', isReadOnly: false, isMandatory: true },
      { columnName: 'priority', columnLabel: 'Priority', columnType: 'choice', isReadOnly: false, isMandatory: true },
      { columnName: 'sprint_name', columnLabel: 'Sprint', columnType: 'string', isReadOnly: false, isMandatory: false },
      { columnName: 'epic_name', columnLabel: 'Epic', columnType: 'string', isReadOnly: false, isMandatory: false },
      { columnName: 'acceptance_criteria', columnLabel: 'Acceptance Criteria', columnType: 'text', isReadOnly: false, isMandatory: false },
      { columnName: 'assigned_to', columnLabel: 'Assigned to', columnType: 'reference', referenceTable: 'sys_user', isReadOnly: false, isMandatory: false },
    ];

    for (const c of storyCols) {
      await prisma.sysDictionary.upsert({
        where: { tableName_columnName: { tableName: 'rm_story', columnName: c.columnName } },
        update: { columnLabel: c.columnLabel, columnType: c.columnType },
        create: { tableName: 'rm_story', ...c },
      });
    }

    // 4. Seed Sprints into sysCustomRecord
    const existingSprints = await prisma.sysCustomRecord.findMany({ where: { tableName: 'rm_sprint' } });
    let sprint1Id = null;
    let sprint2Id = null;

    if (existingSprints.length === 0) {
      const s1 = await prisma.sysCustomRecord.create({
        data: {
          tableName: 'rm_sprint',
          dataJson: JSON.stringify({
            number: 'SPNT0001001',
            name: 'Sprint 26.1 - Core ServiceOps & Portal',
            state: 'active',
            startDate: '2026-10-01',
            endDate: '2026-10-15',
            capacityPoints: 45,
            goal: 'Deliver distinct frontend portal/backend segregation and Excel data grid table editing.',
          }),
        },
      });
      sprint1Id = s1.id;

      const s2 = await prisma.sysCustomRecord.create({
        data: {
          tableName: 'rm_sprint',
          dataJson: JSON.stringify({
            number: 'SPNT0001002',
            name: 'Sprint 26.2 - Mobile & CAD Spatial Hub',
            state: 'planning',
            startDate: '2026-10-16',
            endDate: '2026-10-31',
            capacityPoints: 50,
            goal: 'Expand 3D CAD architectural floorplan interactivity and offline mobile capabilities.',
          }),
        },
      });
      sprint2Id = s2.id;
    }

    // 5. Seed Stories into task table (sysClassName: 'rm_story')
    const existingStories = await prisma.task.findMany({ where: { sysClassName: 'rm_story' } });
    if (existingStories.length === 0) {
      const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
      const itilUser = await prisma.user.findFirst({ where: { role: 'itil' } });

      const stories = [
        {
          number: 'STRY0001001',
          shortDescription: 'As an employee, I want to book ergonomic standing desks with 1-click CAD selection',
          description: 'Provide interactive floorplan view where users can click on desk spaces and reserve immediately with live availability indicators.',
          priority: 2,
          state: 7, // Complete
          assignedToId: itilUser ? itilUser.id : null,
          dynamicFields: JSON.stringify({
            story_points: 5,
            sprint_id: sprint1Id,
            sprint_name: 'Sprint 26.1 - Core ServiceOps & Portal',
            epic_name: 'Workplace & Spatial Hub Architecture',
            acceptance_criteria: 'Given a user views floor 4, when clicking desk 401, then booking confirmation modal opens.',
          }),
        },
        {
          number: 'STRY0001002',
          shortDescription: 'Implement Excel-style inline data grid editing for all platform tables in Admin Studio',
          description: 'Admins need to view, edit, add, and delete records across any table like a live spreadsheet with instant auto-save.',
          priority: 1,
          state: 3, // In Progress
          assignedToId: adminUser ? adminUser.id : null,
          dynamicFields: JSON.stringify({
            story_points: 8,
            sprint_id: sprint1Id,
            sprint_name: 'Sprint 26.1 - Core ServiceOps & Portal',
            epic_name: 'Platform Architecture & Studio IDE',
            acceptance_criteria: 'Admin can click any cell to edit value, press Enter to PATCH, click Add Row to create, click Delete to remove.',
          }),
        },
        {
          number: 'STRY0001003',
          shortDescription: 'Add column customization and slushbucket view personalizer for backend tables',
          description: 'Admins should be able to toggle column visibility, sort ascending/descending, and save custom view preferences.',
          priority: 2,
          state: 3, // In Progress
          assignedToId: adminUser ? adminUser.id : null,
          dynamicFields: JSON.stringify({
            story_points: 5,
            sprint_id: sprint1Id,
            sprint_name: 'Sprint 26.1 - Core ServiceOps & Portal',
            epic_name: 'Platform Architecture & Studio IDE',
            acceptance_criteria: 'User preference persists in localStorage and filters visible columns accurately in the grid.',
          }),
        },
        {
          number: 'STRY0001004',
          shortDescription: 'Separate Frontend Portal and Backend Admin Console with distinct surface mode navigation',
          description: 'Eliminate mixed navbar confusion by clearly segregating Employee Frontend, Fulfiller Workspace, and Backend Admin Console.',
          priority: 1,
          state: 7, // Complete
          assignedToId: adminUser ? adminUser.id : null,
          dynamicFields: JSON.stringify({
            story_points: 3,
            sprint_id: sprint1Id,
            sprint_name: 'Sprint 26.1 - Core ServiceOps & Portal',
            epic_name: 'NextGen Self-Service Portal Experience',
            acceptance_criteria: 'Frontend displays clear employee branding; Workspace displays fulfiller tools; Studio displays backend management console.',
          }),
        },
        {
          number: 'STRY0001005',
          shortDescription: 'Interactive Agile Kanban Board with sprint filtering and velocity metrics',
          description: 'Build dedicated 5-column Kanban board (Backlog, Ready, In Progress, Testing, Complete) with Fibonacci story points.',
          priority: 2,
          state: 2, // Ready
          assignedToId: itilUser ? itilUser.id : null,
          dynamicFields: JSON.stringify({
            story_points: 8,
            sprint_id: sprint1Id,
            sprint_name: 'Sprint 26.1 - Core ServiceOps & Portal',
            epic_name: 'Agile Project Management Engine',
            acceptance_criteria: 'Story cards can transition between columns with live state persistence.',
          }),
        },
        {
          number: 'STRY0001006',
          shortDescription: 'Automated sprint velocity gauge and burndown chart calculation',
          description: 'Compute total completed vs committed story points dynamically across active sprints.',
          priority: 3,
          state: 1, // Backlog
          assignedToId: null,
          dynamicFields: JSON.stringify({
            story_points: 5,
            sprint_id: sprint1Id,
            sprint_name: 'Sprint 26.1 - Core ServiceOps & Portal',
            epic_name: 'Agile Project Management Engine',
            acceptance_criteria: 'Velocity metric updates in real-time as stories move to Complete state.',
          }),
        },
        {
          number: 'STRY0001007',
          shortDescription: 'REST API contract tests for Agile story point velocity calculations',
          description: 'Vitest suite validating Agile story creation, PATCH updates, and state isolation from ITIL incidents.',
          priority: 2,
          state: 4, // Testing & QA
          assignedToId: adminUser ? adminUser.id : null,
          dynamicFields: JSON.stringify({
            story_points: 3,
            sprint_id: sprint1Id,
            sprint_name: 'Sprint 26.1 - Core ServiceOps & Portal',
            epic_name: 'Platform Quality & Compliance',
            acceptance_criteria: 'All unit tests pass verifying story prefix STRY and state transitions.',
          }),
        },
      ];

      for (const st of stories) {
        await prisma.task.create({
          data: {
            number: st.number,
            sysClassName: 'rm_story',
            shortDescription: st.shortDescription,
            description: st.description,
            priority: st.priority,
            state: st.state,
            assignedToId: st.assignedToId,
            dynamicFields: st.dynamicFields,
          },
        });
      }
      console.log(`Successfully seeded ${stories.length} Agile stories.`);
    }

    console.log('Agile tables and records successfully seeded!');
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const localDb = path.resolve(__dirname, '../prisma/dev.db');
  await seedAgile(localDb);
}

main().catch(console.error);
