/**
 * startupLogger.js
 * Displays a styled startup summary with a route table
 * showing Controller, Method, Action (handler), and Path.
 */
const chalk = require('chalk');
const { endpoints } = require('./routeTracker');

function printStartupSummary(app, config, mongooseInstance) {
    const isDev = config.NODE_ENV === 'development';
    const label = (text) => (isDev ? chalk.cyan.bold(text) : text);

    console.log(
        '\n' +
        (isDev
            ? chalk.bgBlue.white.bold(' 🚀 SkillSphere REST API Startup Summary ')
            : '🚀 SkillSphere REST API Startup Summary') +
        '\n'
    );

    console.log(label('Environment: ') + config.NODE_ENV);
    console.log(label('Port: ') + config.PORT);
    console.log(label('App URL: ') + `http://localhost:${config.PORT}`);
    console.log(label('Allowed Origins: ') + (config.ORIGIN || '*'));

    if (isDev && mongooseInstance) {
        console.log(label('DB Name: ') + (mongooseInstance.connection.name || 'skillsphere'));
        console.log(label('Database URL: ') + chalk.gray('<hidden>'));
    }

    console.log('\n' + (isDev ? chalk.bgGreen.black.bold(' Registered Routes ') : 'Registered Routes') + '\n');

    // ── Derive controller name from path ─────────────────
    const getController = (path) => {
        if (path.startsWith('/api/auth')) return 'Auth';
        if (path.startsWith('/api/hod')) return 'HOD';
        if (path.startsWith('/api/admin')) return 'Admin';
        if (path.startsWith('/api/search')) return 'Search';
        if (path.startsWith('/api/verification')) return 'Faculty';
        if (path.startsWith('/api/notifications')) return 'Notification';
        if (path.startsWith('/api/my')) return 'MyAccess';
        if (path.startsWith('/api/placement-drives') || path.startsWith('/api/applications')) return 'Placement';
        if (path.startsWith('/api/students')) {
            if (path.includes('/certifications')) return 'Certification';
            if (path.includes('/projects')) return 'Project';
            if (path.includes('/resumes')) return 'Resume';
            if (path.includes('/coding-profiles')) return 'CodingProfile';
            if (path.includes('/skills')) return 'Skill';
            return 'Student';
        }
        if (path.startsWith('/api/skill-taxonomy')) return 'Skill';
        if (path.startsWith('/api/projects')) return 'Project';
        return 'App';
    };

    const getResource = (path) => {
        const parts = path.split('/').filter(Boolean);
        return parts[1] || '';
    };

    // ── Group by controller ──────────────────────────────
    const grouped = {};
    endpoints.forEach((ep) => {
        if (ep.method === 'OPTIONS') return;
        const ctrl = getController(ep.path);
        if (!grouped[ctrl]) grouped[ctrl] = [];
        grouped[ctrl].push(ep);
    });

    const controllerOrder = [
        'Auth', 'Admin', 'HOD', 'Faculty', 'Student',
        'Skill', 'Certification', 'Project', 'Resume', 'CodingProfile',
        'Placement', 'Search', 'Notification', 'MyAccess', 'App'
    ];

    // ── Table Constants ──────────────────────────────────
    const W = { sno: 6, ctrl: 15, method: 8, res: 16, path: 49 };

    const hr = `├${'─'.repeat(W.sno)}┼${'─'.repeat(W.ctrl)}┼${'─'.repeat(W.method)}┼${'─'.repeat(W.res)}┼${'─'.repeat(W.path)}┤`;
    const top = `┌${'─'.repeat(W.sno)}┬${'─'.repeat(W.ctrl)}┬${'─'.repeat(W.method)}┬${'─'.repeat(W.res)}┬${'─'.repeat(W.path)}┐`;
    const bot = `└${'─'.repeat(W.sno)}┴${'─'.repeat(W.ctrl)}┴${'─'.repeat(W.method)}┴${'─'.repeat(W.res)}┴${'─'.repeat(W.path)}┘`;

    // ── Row Printer — Standardized Padding ────────────────
    const trim = (str, len) => (str.length > len ? str.slice(0, len - 3) + '...' : str);

    const printRow = (sno, ctrl, method, res, path) => {
        // 1. Trim strings to prevent overflowing columns, then pad to exact width
        const sStr = trim(sno || '', W.sno - 2);
        const cStr = trim(ctrl || '', W.ctrl - 2);
        const mStr = trim((method || '').toUpperCase(), W.method - 2);
        const rStr = trim(res || '', W.res - 2);
        const pStr = trim(path || '', W.path - 2);

        const sPadded = sStr.padEnd(W.sno - 2);
        const cPadded = cStr.padEnd(W.ctrl - 2);
        const mPadded = mStr.padEnd(W.method - 2);
        const rPadded = rStr.padEnd(W.res - 2);
        const pPadded = pStr.padEnd(W.path - 2);

        // 2. Apply colors to the padded strings
        const s = isDev ? chalk.gray(sPadded) : sPadded;
        const c = isDev ? chalk.magenta.bold(cPadded) : cPadded;
        const rCol = isDev ? chalk.cyan(rPadded) : rPadded;
        const p = isDev ? chalk.blueBright(pPadded) : pPadded;

        let m = mPadded;
        if (isDev) {
            switch (mStr) {
                case 'GET': m = chalk.green.bold(mPadded); break;
                case 'POST': m = chalk.blue.bold(mPadded); break;
                case 'PUT': m = chalk.yellow.bold(mPadded); break;
                case 'PATCH': m = chalk.hex('#fca130').bold(mPadded); break;
                case 'DELETE': m = chalk.red.bold(mPadded); break;
                default: m = chalk.white(mPadded);
            }
        }

        console.log(`│ ${s} │ ${c} │ ${m} │ ${rCol} │ ${p} │`);
    };

    // Header
    console.log(top);
    printRow('S.No', 'Ctrl', 'Method', 'Resource', 'Path');
    console.log(hr);

    // Data
    let firstGroup = true;
    let counter = 1;
    controllerOrder.forEach((ctrl) => {
        if (!grouped[ctrl] || grouped[ctrl].length === 0) return;

        if (!firstGroup) console.log(hr);
        firstGroup = false;

        grouped[ctrl].forEach((ep) => {
            printRow(
                (counter++).toString() + '.',
                ctrl,
                ep.method,
                getResource(ep.path),
                ep.path
            );
        });
    });

    console.log(bot);

    const total = endpoints.filter(e => e.method !== 'OPTIONS').length;
    console.log(
        isDev
            ? chalk.gray(`\n  Total: ${total} endpoints\n`) +
            chalk.yellow(`  Visit API at http://localhost:${config.PORT}/api/health\n`)
            : `\n  Registered Endpoints: ${total}\n`
    );
}

module.exports = { printStartupSummary };
