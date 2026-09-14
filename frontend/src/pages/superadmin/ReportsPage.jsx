import React, { useEffect, useState } from 'react';
import ApiClient from '../../services/api';
import { BarChart3, History, ShieldAlert } from 'lucide-react';

export const SuperadminReportsPage = () => {
  const [activeTab, setActiveTab] = useState('usage');
  const [usageData, setUsageData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'usage') fetchUsage();
    else fetchAudit();
  }, [activeTab]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.get('/reports/usage');
      if (res.data) setUsageData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.get('/reports/audit');
      if (res.data) setAuditLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Trazabilidad de Auditoría</h1>
          <p className="page-subtitle">Monitoreo completo de uso de Chromebooks e historial de operaciones</p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('usage')}
            className={activeTab === 'usage' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            <BarChart3 size={18} />
            Uso por Ciclo/Carro
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={activeTab === 'audit' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            <History size={18} />
            Bitácora de Auditoría
          </button>
        </div>
      </div>

      {activeTab === 'usage' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading ? (
            <p>Cargando reportes de uso...</p>
          ) : (
            usageData.map((cycleGroup, idx) => (
              <div key={idx} className="card">
                <div className="card-header">
                  <h3 className="card-title">Ciclo: {cycleGroup.cycleName} ({cycleGroup.cycleType})</h3>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Carro de Chromebooks</th>
                        <th>Asignación Inicial</th>
                        <th>Equipos Prestados</th>
                        <th>Solicitudes Recibidas</th>
                        <th>Solicitudes Aprobadas</th>
                        <th>Porcentaje de Uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycleGroup.carts.map((cartItem, cIdx) => (
                        <tr key={cIdx}>
                          <td style={{ fontWeight: 600 }}>{cartItem.cartName}</td>
                          <td>{cartItem.allocatedQuantity} unidades</td>
                          <td style={{ fontWeight: 700 }}>{cartItem.totalEquipmentLoaned} unidades</td>
                          <td>{cartItem.totalReservationRequests}</td>
                          <td>{cartItem.approvedRequestsCount}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${cartItem.utilizationPercentage}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{cartItem.utilizationPercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registro de Auditoría del Sistema</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Detalles del Cambio</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>Cargando auditoría...</td></tr>
                ) : auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema'}</td>
                    <td>
                      <span className="badge badge-parcial">{log.action}</span>
                    </td>
                    <td>{log.entityType}</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
