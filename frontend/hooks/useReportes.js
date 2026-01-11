import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { apiGet } from '../services/api';

export const useReportes = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generalStats, setGeneralStats] = useState(null);
  const [financialStats, setFinancialStats] = useState([]);
  const [occupancyStats, setOccupancyStats] = useState([]);
  const [specialtyStats, setSpecialtyStats] = useState([]);
  const [demographicsStats, setDemographicsStats] = useState([]);
  const [servicesStats, setServicesStats] = useState([]);
  const [doctorsStats, setDoctorsStats] = useState([]);
  const [qualityStats, setQualityStats] = useState([]);
  const [auditStats, setAuditStats] = useState([]);

  const fetchGeneralStats = useCallback(async (periodo = 'mes') => {
    try {
      setLoading(true);
      const { data } = await apiGet('/reportes/general', { periodo });
      setGeneralStats(data);
    } catch (error) {
      console.error('Error fetching general stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas generales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchFinancialStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/financial');
      setFinancialStats(data);
    } catch (error) {
      console.error('Error fetching financial stats:', error);
    }
  }, []);

  const fetchOccupancyStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/occupancy');
      setOccupancyStats(data);
    } catch (error) {
      console.error('Error fetching occupancy stats:', error);
    }
  }, []);

  const fetchSpecialtyStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/specialty');
      setSpecialtyStats(data);
    } catch (error) {
      console.error('Error fetching specialty stats:', error);
    }
  }, []);

  const fetchDemographicsStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/demographics');
      setDemographicsStats(data);
    } catch (error) {
      console.error('Error fetching demographics stats:', error);
    }
  }, []);

  const fetchServicesStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/services');
      setServicesStats(data);
    } catch (error) {
      console.error('Error fetching services stats:', error);
    }
  }, []);

  const fetchDoctorsStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/doctors');
      setDoctorsStats(data);
    } catch (error) {
      console.error('Error fetching doctors stats:', error);
    }
  }, []);

  const fetchQualityStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/quality');
      setQualityStats(data);
    } catch (error) {
      console.error('Error fetching quality stats:', error);
    }
  }, []);

  const fetchAuditStats = useCallback(async () => {
    try {
      const { data } = await apiGet('/reportes/audit');
      setAuditStats(data);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  }, []);

  const fetchAllStats = useCallback(async (periodo) => {
    setLoading(true);
    await Promise.all([
      fetchGeneralStats(periodo),
      fetchFinancialStats(),
      fetchOccupancyStats(),
      fetchSpecialtyStats(),
      fetchDemographicsStats(),
      fetchServicesStats(),
      fetchDoctorsStats(),
      fetchQualityStats(),
      fetchAuditStats(),
    ]);
    setLoading(false);
  }, [
    fetchGeneralStats,
    fetchFinancialStats,
    fetchOccupancyStats,
    fetchSpecialtyStats,
    fetchDemographicsStats,
    fetchServicesStats,
    fetchDoctorsStats,
    fetchQualityStats,
    fetchAuditStats,
  ]);

  return {
    loading,
    generalStats,
    financialStats,
    occupancyStats,
    specialtyStats,
    demographicsStats,
    servicesStats,
    doctorsStats,
    qualityStats,
    auditStats,
    fetchGeneralStats,
    fetchAllStats,
  };
};

export default useReportes;
