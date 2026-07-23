-- Question 4/4 - Tutorial
-- Afficher uniquement les colonnes PRODUCT_ID, NAME et PRICE
-- Filtrer les produits avec un prix supérieur à 100
-- Trier en ordre décroissant par prix

SELECT PRODUCT_ID, NAME, PRICE
FROM PRODUCTS
WHERE PRICE > 100
ORDER BY PRICE DESC;
