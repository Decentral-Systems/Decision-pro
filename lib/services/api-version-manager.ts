/**
 * API Version Manager
 * Handles API version compatibility and negotiation
 */

export interface APIVersion {
  version: string;
  supported: boolean;
  deprecated: boolean;
  deprecationDate?: Date;
  endOfLifeDate?: Date;
}

export interface VersionMismatch {
  clientVersion: string;
  serverVersion: string;
  compatible: boolean;
  message: string;
}

export class APIVersionManager {
  private currentVersion: string = "v1";
  private supportedVersions: string[] = ["v1"];
  private versionCache: Map<string, APIVersion> = new Map();

  /**
   * Get current API version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Set API version
   */
  setVersion(version: string): void {
    if (this.supportedVersions.includes(version)) {
      this.currentVersion = version;
    } else {
      console.warn(`Unsupported API version: ${version}. Using ${this.currentVersion}`);
    }
  }

  /**
   * Check version compatibility
   */
  checkCompatibility(clientVersion: string, serverVersion: string): VersionMismatch {
    const compatible = this.supportedVersions.includes(serverVersion);

    return {
      clientVersion,
      serverVersion,
      compatible,
      message: compatible
        ? "Versions are compatible"
        : `Version mismatch: Client ${clientVersion} vs Server ${serverVersion}`,
    };
  }

  /**
   * Negotiate API version with server
   */
  async negotiateVersion(serverVersions: string[]): Promise<string> {
    // Find highest supported version
    const supported = serverVersions.filter((v) => this.supportedVersions.includes(v));
    
    if (supported.length === 0) {
      console.warn("No compatible API version found. Using default:", this.currentVersion);
      return this.currentVersion;
    }

    // Use highest version
    const negotiated = supported.sort().reverse()[0];
    this.setVersion(negotiated);
    
    return negotiated;
  }

  /**
   * Log version mismatch
   */
  logVersionMismatch(mismatch: VersionMismatch): void {
    console.warn("[API Version Mismatch]", mismatch);
    
    // Could send to analytics/monitoring
    if (typeof window === "undefined") return;
    try {
      const mismatches = JSON.parse(
        localStorage.getItem("api_version_mismatches") || "[]"
      );
      mismatches.push({
        ...mismatch,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("api_version_mismatches", JSON.stringify(mismatches.slice(-10))); // Keep last 10
    } catch (error) {
      console.warn("Failed to log version mismatch:", error);
    }
  }

  /**
   * Get version info
   */
  getVersionInfo(version: string): APIVersion {
    if (this.versionCache.has(version)) {
      return this.versionCache.get(version)!;
    }

    const info: APIVersion = {
      version,
      supported: this.supportedVersions.includes(version),
      deprecated: false, // Would come from server
    };

    this.versionCache.set(version, info);
    return info;
  }

  /**
   * Add supported version
   */
  addSupportedVersion(version: string): void {
    if (!this.supportedVersions.includes(version)) {
      this.supportedVersions.push(version);
    }
  }
}

// Singleton instance
export const apiVersionManager = new APIVersionManager();
