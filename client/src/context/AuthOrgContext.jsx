import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setApiOrgId, setClerkTokenProvider } from "../services/api";

const AuthOrgContext = createContext(null);

export const AuthOrgProvider = ({ children, clerkUser, getToken }) => {
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set Clerk token provider
  useEffect(() => {
    if (getToken) {
      setClerkTokenProvider(getToken);
    }
  }, [getToken]);

  // Sync real Clerk user & load real organizations from Neon PostgreSQL
  const loadData = async () => {
    try {
      setLoading(true);
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "User",
          email: clerkUser.primaryEmailAddress?.emailAddress,
          avatar: clerkUser.imageUrl,
          role: "OWNER",
        });
      }

      // Fetch user's real organizations from Neon
      const orgs = await api.getOrganizations();
      setOrganizations(orgs);

      const urlParams = new URLSearchParams(window.location.search);
      const queryOrgId = urlParams.get("orgId");
      const savedOrgId = localStorage.getItem("nexus_active_org_id");

      const matched =
        (queryOrgId && orgs.find((o) => o.id === queryOrgId)) ||
        orgs.find((o) => o.id === savedOrgId) ||
        orgs[0];

      if (matched) {
        setActiveOrg(matched);
        setApiOrgId(matched.id);
      } else if (orgs.length === 0 && clerkUser) {
        // Create user's initial real workspace in Neon PostgreSQL
        const defaultName = `${clerkUser.firstName || "My"} Workspace`;
        const newOrg = await api.createOrganization({
          name: defaultName,
          description: "Primary workspace for projects and team collaboration",
        });
        setOrganizations([newOrg]);
        setActiveOrg(newOrg);
        setApiOrgId(newOrg.id);
      }
    } catch (err) {
      console.error("Failed loading organizations from database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clerkUser]);

  const switchOrg = (org) => {
    setActiveOrg(org);
    setApiOrgId(org.id);
  };

  const createOrg = async (name, description) => {
    const newOrg = await api.createOrganization({ name, description });
    setOrganizations((prev) => [newOrg, ...prev]);
    switchOrg(newOrg);
    return newOrg;
  };

  return (
    <AuthOrgContext.Provider
      value={{
        user,
        organizations,
        activeOrg,
        loading,
        switchOrg,
        createOrg,
        reloadUserData: loadData,
      }}
    >
      {children}
    </AuthOrgContext.Provider>
  );
};

export const useAuthOrg = () => useContext(AuthOrgContext);
