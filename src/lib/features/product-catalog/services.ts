// ============================================================================
// Product catalog — server barrel
// ============================================================================
//
// Data access, admin auth, and public read orchestration. Import only from
// server code (`import 'server-only'`).

import 'server-only'

export {
	listCategoriesByPlatform,
	getCategoryById,
	createCategory,
	updateCategoryById,
	deleteCategoryById,
	listBrandsByPlatform,
	getBrandById,
	createBrand,
	updateBrandById,
	deleteBrandById,
	searchModelsByName,
	listModelsByPlatform,
	getModelById,
	createModel,
	updateModelById,
	deleteModelById,
	getSpecificationByModelId,
	getSpecificationById,
	createSpecification,
	updateSpecificationById,
	deleteSpecificationById,
} from './_data-access/catalogDafs'

export { authenticateAndAuthorizeAdminCatalog } from './_auth/catalogAuth'

export {
	listCategoriesPublic,
	getCategorySpecSchemaPublic,
	listBrandsPublic,
	searchModelsPublic,
	getModelPublic,
	getSpecificationByModelPublic,
} from './_utils/publicCatalog'
