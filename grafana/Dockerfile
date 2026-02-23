# ═══════════════════════════════════════════════════════════
# Grafana Dockerfile — Railway deployment
# Bundles all provisioning config + dashboards into the image
# ═══════════════════════════════════════════════════════════

FROM grafana/grafana:10.4.2

# Switch to root to copy provisioning files
USER root

# Copy all provisioning config into the image
COPY provisioning/ /etc/grafana/provisioning/
COPY dashboards /var/lib/grafana/dashboards

# Grafana reads these env vars for admin credentials
# Set them in Railway: GF_SECURITY_ADMIN_USER, GF_SECURITY_ADMIN_PASSWORD
ENV GF_SECURITY_ADMIN_USER=${GF_SECURITY_ADMIN_USER:-admin}
ENV GF_SECURITY_ADMIN_PASSWORD=${GF_SECURITY_ADMIN_PASSWORD:-GrafanaAdmin@2024}

ENV GF_PATHS_PROVISIONING=/etc/grafana/provisioning
ENV GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/var/lib/grafana/dashboards/campus_carbon.json

# Allow Grafana to run on Railway's assigned PORT
ENV GF_SERVER_HTTP_PORT=${PORT:-3000}

# Disable login for easier access (optional — remove for security)
# ENV GF_AUTH_ANONYMOUS_ENABLED=true

# Switch back to grafana user for security
USER grafana

EXPOSE 3000
