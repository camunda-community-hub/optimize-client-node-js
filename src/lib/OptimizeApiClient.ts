import { getOptimizeToken } from "camunda-saas-oauth";
import { getOptimizeCredentials } from "camunda-8-credentials-from-env"
import got from 'got';
import { DashboardCollection, DashboardDefinition, EntityImportResponse, ReportCollection, ReportDataExporter, SingleProcessReport, Variable, VariableLabels } from "./APIObjects";
import { ReportResults } from "./ReportResults";
const pkg = require('../../package.json')

export class OptimizeApiClient {
    private userAgentString: string
    // baseUrl: string
    private gotOptions: { prefixUrl: string; }

    /**
     * 
     * @param userAgent An optional custom string to add to the user-agent for API calls
     */
    constructor(userAgent?: string) {
        const customAgent = userAgent ? ` ${userAgent}` : ``
        this.userAgentString = `optimize-client-nodejs/${pkg.version}${customAgent}`
        const creds = getOptimizeCredentials()
        this.gotOptions = {
            prefixUrl: `${creds.CAMUNDA_OPTIMIZE_BASE_URL}/api/public`
        }
    }

    private async getHeaders() {
        return {
            'content-type': 'application/json',
            'authorization': `Bearer ${await getOptimizeToken(this.userAgentString)}`,
            'user-agent': this.userAgentString,
            'accept': '*/*'
        }
    }

    /**
     * @description This API allows users to enable the sharing functionality for all reports and dashboards in Optimize. 
     * 
     * Note that this setting will be permanently persisted in memory and will take precedence over any other previous configurations (e.g. configuration files).
     * 
     * If sharing had been previously enabled and then disabled, re-enabling sharing will allow users to access previously shared URLs under the same address as before. Calling this endpoint when sharing is already enabled will have no effect.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/configuration/enable-sharing/)
     * @example
     *  ```typescript
     * const client = new OptimizeApiClient()
     * client.enableSharing()
     * ```
     */
    async enableSharing() {
        const headers = await this.getHeaders()
        return got.post(`share/enable`, {
            body: '',
            headers,
            ...this.gotOptions
        })
    }

    /**
     * @description This API allows users to disable the sharing functionality for all reports and dashboards in Optimize. 
     * 
     * Note that this setting will be permanently persisted in memory and will take precedence over any other previous configurations (e.g. configuration files).
     * 
     * When sharing is disabled, previously shared URLs will no longer be accessible. Upon re-enabling sharing, the previously shared URLs will work once again under the same address as before. Calling this endpoint when sharing is already disabled will have no effect.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/configuration/disable-sharing/)
     * @example
     *  ```typescript
     * const client = new OptimizeApiClient()
     * client.disableSharing()
     * ```
     */
    async disableSharing() {
        const headers = await this.getHeaders()
        return got.post(`share/disable`, {
            body: '',
            headers,
            ...this.gotOptions
        })
    }

    /**
     * 
     * @description This API allows users to retrieve all dashboard IDs from a given collection. 
     * 
     * The response contains a list of IDs of the dashboards existing in the collection with the given collection ID.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/dashboard/get-dashboard-ids/)
     * 
     * @param collectionId The ID of the collection for which to retrieve the dashboard IDs.
     * @example
     * ```
     * const client = new OptimizeApiClient()
     * const dashboardIds = await client.getDashboardIds(1234)
     * ```
     */
    async getDashboardIds(collectionId: number): Promise<DashboardCollection> {
        const headers = await this.getHeaders()
        return got(`dashboard?collectionId=${collectionId}`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    // Camunda 7-only
    // async deleteDashboard(dashboardId: string) {
    //     const headers = await this.getHeaders()
    //     return got.delete(`dashboard/${dashboardId}`, {
    //         headers,
    //         ...this.gotOptions
    //     })
    // }

    /**
     * @description This API allows users to export dashboard definitions which can later be imported into another Optimize system. 
     * 
     * Note that exporting a dashboard also exports all reports contained within the dashboard. The dashboards to be exported may be within a Collection or private entities, the API has access to both.
     * 
     * The obtained list of entity exports can be imported into other Optimize systems either using the dedicated import API or via UI.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/dashboard/export-dashboard-definitions/)
     * 
     * @param dashboardIds Array of dashboard ids
     * @example
     * ```
     * const client = new OptimizeApiClient()
     * const dashboardDefs = await client.exportDashboardDefinitions(["123", "456"])
     * ```
     */
    async exportDashboardDefinitions(dashboardIds: string[]): Promise<Array<DashboardDefinition|SingleProcessReport>> {
        const headers = await this.getHeaders()
        return got.post(`export/dashboard/definition/json`, {
            body: JSON.stringify(dashboardIds),
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * @description This API allows users to retrieve all report IDs from a given collection. The response contains a list of IDs of the reports existing in the collection with the given collection ID.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/report/get-report-ids/)
     * 
     * @param collectionId the id of the collection
     * @example
     * ```
     * const client = new OptimizeApiClient()
     * const reports =  await client.getReportIds(1234)
     * ```
     */
    async getReportIds(collectionId: number): Promise<ReportCollection> {
        const headers = await this.getHeaders()
        return got(`report?collectionId=${collectionId}`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * @description The report deletion API allows you to delete reports by ID from Optimize.
     * 
     * [Camunda 8 documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/report/delete-report/)
     * 
     * @param reportId The ID of the report you wish to delete
     * 
     * @example
     * ```
     * const client = new OptimizeApiClient()
     * client.deleteReport("e6c5aaa1-6a18-44e7-8480-d562d511ba62")
     * ```
     */
    async deleteReport(reportId: string) {
        const headers = await this.getHeaders()
        return got.delete(`report/${reportId}`, {
            headers,
            ...this.gotOptions
        }).text()
    }

    /**
     * @description This API allows users to export report definitions which can later be imported into another Optimize system. The reports to be exported may be within a collection or private entities, the API has access to both.
     * 
     * The obtained list of entity exports can be imported into other Optimize systems either using the dedicated import API or via UI.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/report/export-report-definitions/)
     * 
     * @param reportIds array of report IDs
     * @example
     * ```
     * const client = new OptimizeApiClient()
     * const reportDefs = await client.exportReportDefinitions(["123", "456"])
     * ```
     */
    async exportReportDefinitions(reportIds: string[]): Promise<Array<SingleProcessReport>> {
        const headers = await this.getHeaders()
        return got.post(`export/dashboard/definition/json`, {
            body: JSON.stringify(reportIds),
            headers,
            ...this.gotOptions
        }).json()        
    }

    /**
     * @description The data export API allows users to export large amounts of data in a machine-readable format (JSON) from Optimize.
     * @param reportId 
     * @param limit 
     * @param paginationTimeoutSec 
     * @example
     * ```
     * const client = new OptimizeApiClient()
     * const exporter = client.exportReportResultData("e6c5aaa1-6a18-44e7-8480-d562d511ba62") 
     * const page1 = await exporter.next()
     * ``` 
     */
    exportReportResultData(reportId: string, limit = 2, paginationTimeoutSec=60): ReportDataExporter {
        return new ReportResults({
            getHeaders: () => this.getHeaders(),
            gotOptions: this.gotOptions,
            limit,
            paginationTimeout: paginationTimeoutSec,
            reportId
        })
    }

    // Camunda 7-only
    // async ingestEventBatch(events: CloudEventV1<any>[]) {
    //     const body = JSON.stringify(events)
    //     const headers = await this.getHeaders()
    //     return got.post(`ingestion/event/batch`, {
    //         body,
    //         headers,
    //         ...this.gotOptions
    //     }).json()                
    // }

    /**
     * @description With the external variable ingestion API, variable data held in external systems can be ingested into Optimize directly, without the need for these variables to be present in your Camunda platform data. This can be useful when external business data, which is relevant for process analysis in Optimize, is to be associated with specific process instances.
     * 
     * Especially if this data changes over time, it is advisable to use this REST API to persist external variable updates to Optimize, as otherwise Optimize may not be aware of data changes in the external system.
     * @param variables 
     * @example
     * ```
     * const variables = [
     *  {
     *    "id": "7689fced-2639-4408-9de1-cf8f72769f43",
     *    "name": "address",
     *    "type": "string",
     *    "value": "Main Street 1",
     *    "processInstanceId": "c6393461-02bb-4f62-a4b7-f2f8d9bbbac1",
     *    "processDefinitionKey": "shippingProcess"
     *  },
     *  {
     *    "id": "993f4e73-7f6a-46a6-bd45-f4f8e3470ba1",
     *    "name": "amount",
     *    "type": "integer",
     *    "value": "500",
     *    "processInstanceId": "8282ed49-2243-44df-be5e-1bf893755d8f",
     *    "processDefinitionKey": "orderProcess"
     *  }
     * ]
     * const client = new OptimizeApiClient()
     * client.ingestExternalVariable(variables)
     * ``` 
     */
    async ingestExternalVariable(variables: Variable[]) {
        const headers = await this.getHeaders()
        return got.post(`ingestion/variable`, {
            body: JSON.stringify(variables),
            headers,
            ...this.gotOptions
        }).json()               
    }

    /**
     * @description The purpose of Health-Readiness REST API is to return information indicating whether Optimize is ready to be used.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/health-readiness/)
     * 
     * @example
     * ```
     * const client = new OptimizeApiClient()
     * try {
     *    await client.getReadiness()
     *    console.log('Ready!')
     * } catch (e: any) {
     *    console.log('Error calling readiness point: ' + e.code)
     * }
     * ```
     */
    async getReadiness() {
        const headers = await this.getHeaders()
        return got(`readyz`, {
            headers,
            ...this.gotOptions
        }).json()        
    }

    /**
     * @description This API allows users to import entity definitions such as reports and dashboards into existing collections. These entity definitions may be obtained either using the report or dashboard export API or via the UI.
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/import-entities/)
     * 
     * @example 
     * ```
     * const entities = [
     *    {
     *        "id": "61ae2232-51e1-4c35-b72c-c7152ba264f9",
     *        "exportEntityType": "single_process_report",
     *        "name": "Number: Process instance duration",
     *        "sourceIndexVersion": 8,
     *        "collectionId": null,
     *        "data": {...}
     *    },
     *    {
     *        "id": "b0eb845-e8ed-4824-bd85-8cd69038f2f5",
     *        "exportEntityType": "dashboard",
     *        "name": "Dashboard 1",
     *        "sourceIndexVersion": 5,
     *        "reports": [
     *            {
     *                "id": "61ae2232-51e1-4c35-b72c-c7152ba264f9",
     *                ...
     *            }
     *        ],
     *        "availableFilters": [...],
     *        "collectionId": null
     *    }
     * ]
     * const client = new OptimizeApiClient()
     * await client.importEntities(123, entities)
     *```
     */
    async importEntities(collectionId: number, entities: any): Promise<EntityImportResponse> {
        const headers = await this.getHeaders()
        return got(`import?collectionId=${collectionId}`, {
            headers,
            body: JSON.stringify(entities),
            ...this.gotOptions
        }).json()        
    }

    /**
     * @description With the variable labeling endpoint, variable labels can be added, updated, and deleted from Optimize. 
     * 
     * [Camunda 8 Documentation](https://docs.camunda.io/optimize/apis-clients/optimize-api/variable-labeling/)
     * 
     * @example
     * ```
     * const variableLabels =  {
     *   "definitionKey": "bookrequest-1-tenant",
     *   "labels" : [
     *     {
     *       "variableName": "bookAvailable",
     *       "variableType": "Boolean",
     *       "variableLabel": "book availability"
     *     },
     *     {
     *       "variableName": "person.name",
     *       "variableType": "String",
     *       "variableLabel": "first and last name"
     *     },
     *     {
     *       "variableName": "person.hobbies._listSize",
     *       "variableType": "Long",
     *       "variableLabel": "amount of hobbies"
     *     }
     *   ]
     * }
     * const client = new OptimizeApiClient()
     * await client.labelVariables(variableLabels)
     * ```
     */
    async labelVariables(variableLabels: VariableLabels) {
        const headers = await this.getHeaders()
        return got(`variables/labels`, {
            headers,
            body: JSON.stringify(variableLabels),
            ...this.gotOptions
        }).json()                
    }
}