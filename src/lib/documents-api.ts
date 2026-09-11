import { useStore } from "./dhi-store";
import {
  PRODUCT_DOC_TYPE_LABEL,
  PROJECT_DOC_TYPE_LABEL,
  type ProductDocument,
  type ProductDocumentType,
  type ProjectDocument,
  type ProjectDocumentType,
} from "./dhi-data";

/**
 * Couche "API" documents.
 *
 * L'application pilote ses données côté client (store React persistant en
 * localStorage) : les endpoints ci-dessous reproduisent le contrat
 *   GET  /api/products/:id/documents
 *   POST /api/products/:id/documents
 *   GET  /api/projects/:id/documents
 *   POST /api/projects/:id/documents
 * en s'appuyant sur le store comme source de vérité.
 */

export type ProductDocumentInput = Omit<ProductDocument, "id">;
export type ProjectDocumentInput = Omit<ProjectDocument, "id">;

export function useProductDocsApi() {
  const {
    productDocuments,
    projectDocuments,
    addProductDocument,
    addProjectDocument,
    deleteProductDocument,
    deleteProjectDocument,
  } = useStore();

  return {
    /** GET /api/products/:productId/documents */
    listProductDocs: (productId: string): ProductDocument[] =>
      productDocuments.filter((d) => d.productId === productId),

    /** POST /api/products/:productId/documents */
    createProductDoc: (productId: string, input: Omit<ProductDocumentInput, "productId">): string =>
      addProductDocument({ ...input, productId }),

    /** DELETE /api/products/:id/documents/:documentId */
    removeProductDoc: (documentId: string): void => deleteProductDocument(documentId),

    /** GET /api/projects/:projectId/documents */
    listProjectDocs: (projectId: string): ProjectDocument[] =>
      projectDocuments.filter((d) => d.projectId === projectId),

    /** POST /api/projects/:projectId/documents */
    createProjectDoc: (projectId: string, input: Omit<ProjectDocumentInput, "projectId">): string =>
      addProjectDocument({ ...input, projectId }),

    /** DELETE /api/projects/:id/documents/:documentId */
    removeProjectDoc: (documentId: string): void => deleteProjectDocument(documentId),

    labels: {
      product: PRODUCT_DOC_TYPE_LABEL,
      project: PROJECT_DOC_TYPE_LABEL,
    },
  };
}

export type { ProductDocumentType, ProjectDocumentType };
