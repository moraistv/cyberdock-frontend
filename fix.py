import os

path = 'src/components/UserSalesTable.vue'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

new_content = """const handleSync = async () => {
    if (syncState.value.isSyncing) return;

    if (!mlAccounts.value || mlAccounts.value.length === 0) {
        summaryModalTitle.value = 'Nenhuma Conta Encontrada';
        summaryModalContent.value = '<p>Este usuário não possui contas do Mercado Livre conectadas para sincronizar.</p>';
        isSummaryModalOpen.value = true;
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const account of mlAccounts.value) {
        const { user_id: accountId, nickname } = account;

        if (!accountId || !nickname) {
            console.warn(`Conta ignorada por falta de ID ou Nickname:`, account);
            continue;
        }

        try {
            await syncAccount(accountId, nickname, props.userId, syncTimeframe.value);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            await enrichExistingSales(accountId, nickname, props.userId);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            successCount++;
        } catch (error) {
            console.error(`Erro ao sincronizar ${nickname}:`, error);
            errorCount++;
        }
    }
    
    await fetchSales();
    
    if (errorCount > 0) {
        summaryModalTitle.value = 'Sincronização Finalizada com Alertas';
        summaryModalContent.value = `<p>Sincronizadas: ${successCount}. Falhas: ${errorCount}. Verifique os logs para mais detalhes.</p>`;
        isSummaryModalOpen.value = true;
    }
};
"""

lines[1933:1949] = [new_content]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
