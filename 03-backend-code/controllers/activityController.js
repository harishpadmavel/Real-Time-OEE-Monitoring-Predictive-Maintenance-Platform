const DowntimeLog = require("../models/DowntimeLog");
const ProductionLog = require("../models/ProductionLog");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const ShiftSession = require("../models/ShiftSession");

// GET /api/activity/my
async function getMyActivity(req, res) {
  try {
    const operatorId = req.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [downtimes, productions, requests, shifts] = await Promise.all([
      DowntimeLog.find({
        loggedBy: operatorId,
        createdAt: { $gte: sevenDaysAgo },
      })
        .populate("machine", "name lineId")
        .sort({ createdAt: -1 }),

      ProductionLog.find({
        loggedBy: operatorId,
        createdAt: { $gte: sevenDaysAgo },
      })
        .populate("machine", "name lineId")
        .sort({ createdAt: -1 }),

      MaintenanceRequest.find({
        raisedBy: operatorId,
        createdAt: { $gte: sevenDaysAgo },
      })
        .populate("machine", "name lineId")
        .populate("acknowledgedBy", "name")
        .populate("resolvedBy", "name")
        .sort({ createdAt: -1 }),

      ShiftSession.find({
        operator: operatorId,
        createdAt: { $gte: sevenDaysAgo },
      })
        .populate("machine", "name lineId")
        .sort({ createdAt: -1 }),
    ]);

    // Build unified feed sorted newest first
    const items = [];

    downtimes.forEach((d) => {
      items.push({
        id: d._id,
        type: "DOWNTIME",
        timestamp: d.startTime || d.createdAt,
        machine: d.machine,
        title: `Downtime: ${d.reason.replace(/_/g, " ")}`,
        status: d.endTime ? "RESOLVED" : "ACTIVE",
        details: {
          reason: d.reason,
          notes: d.notes,
          durationMinutes: d.durationMinutes,
          endTime: d.endTime,
        },
      });
    });

    productions.forEach((p) => {
      items.push({
        id: p._id,
        type: "PRODUCTION",
        timestamp: p.timestamp || p.createdAt,
        machine: p.machine,
        title: `Production: +${p.goodUnits} good ${p.defectiveUnits > 0 ? `(${p.defectiveUnits} rejects)` : ""}`,
        status: "LOGGED",
        details: {
          goodUnits: p.goodUnits,
          defectiveUnits: p.defectiveUnits,
          rejectReason: p.rejectReason,
          source: p.source,
        },
      });
    });

    requests.forEach((r) => {
      items.push({
        id: r._id,
        type: "MAINTENANCE_REQUEST",
        timestamp: r.createdAt,
        machine: r.machine,
        title: `${r.target} Call: ${r.priority} Priority`,
        status: r.status,
        details: {
          target: r.target,
          priority: r.priority,
          description: r.description,
          acknowledgedBy: r.acknowledgedBy?.name,
          resolvedBy: r.resolvedBy?.name,
        },
      });
    });

    shifts.forEach((s) => {
      items.push({
        id: s._id,
        type: "SHIFT",
        timestamp: s.startTime,
        machine: s.machine,
        title: `Shift: ${s.shiftName}`,
        status: s.endTime ? "COMPLETED" : "ACTIVE",
        details: {
          startTime: s.startTime,
          endTime: s.endTime,
          targetUnits: s.targetUnits,
          summary: s.summary,
        },
      });
    });

    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      activities: items,
      raw: {
        downtimes,
        productions,
        requests,
        shifts,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch operator activity", error: err.message });
  }
}

module.exports = { getMyActivity };
