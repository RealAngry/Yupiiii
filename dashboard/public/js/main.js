// Main JavaScript file for the dashboard

// Show toast messages
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '11';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Add toast to container
    document.querySelector('.toast-container').innerHTML += toastHtml;
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard!', 'success');
    }, function(err) {
        showToast('Failed to copy text: ' + err, 'danger');
    });
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Add copy buttons to code blocks
    document.querySelectorAll('pre code').forEach(function(block) {
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-primary copy-button';
        button.innerHTML = '<i class="fas fa-copy"></i>';
        button.title = 'Copy to clipboard';
        button.addEventListener('click', function() {
            copyToClipboard(block.textContent);
        });
        
        const wrapper = document.createElement('div');
        wrapper.className = 'position-relative';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        wrapper.appendChild(button);
    });
    
    // Add click handlers for copy buttons
    document.querySelectorAll('.copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const text = this.getAttribute('data-copy');
            copyToClipboard(text);
        });
    });
    
    // Auto Roles functionality
    if (document.querySelector('.autoroles-container')) {
        // Add auto role
        document.getElementById('add-autorole').addEventListener('click', function() {
            const container = document.querySelector('.autoroles-container');
            const items = container.querySelectorAll('.autorole-item');
            const newIndex = items.length;
            
            const template = `
                <div class="autorole-item mb-2 d-flex align-items-center">
                    <select class="form-select me-2" name="autoroles.roles[${newIndex}]">
                        <option value="">Select a role</option>
                        ${Array.from(items[0].querySelector('select').options).map(option => 
                            `<option value="${option.value}" style="color: ${option.style.color}">${option.text}</option>`
                        ).join('')}
                    </select>
                    <button type="button" class="btn btn-danger remove-autorole"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = template.trim();
            const newItem = tempDiv.firstChild;
            
            container.appendChild(newItem);
            
            // Add event listener to the new remove button
            newItem.querySelector('.remove-autorole').addEventListener('click', removeAutorole);
        });
        
        // Remove auto role
        document.querySelectorAll('.remove-autorole').forEach(btn => {
            btn.addEventListener('click', removeAutorole);
        });
        
        function removeAutorole() {
            const container = document.querySelector('.autoroles-container');
            const items = container.querySelectorAll('.autorole-item');
            
            // Don't remove if it's the last item
            if (items.length <= 1) {
                return;
            }
            
            this.closest('.autorole-item').remove();
            
            // Update indices
            container.querySelectorAll('.autorole-item').forEach((item, index) => {
                item.querySelector('select').name = `autoroles.roles[${index}]`;
            });
        }
    }
    
    // Reaction Roles functionality
    if (document.getElementById('create-reaction-role')) {
        // Create reaction role
        document.getElementById('create-reaction-role').addEventListener('click', function() {
            // Reset form
            document.getElementById('reaction-role-form').reset();
            document.getElementById('reaction-role-index').value = '-1';
            document.getElementById('reactionRoleModalLabel').textContent = 'Create Reaction Role';
            
            // Clear reaction roles container except for the first item
            const container = document.getElementById('reaction-roles-container');
            const items = container.querySelectorAll('.reaction-role-item');
            
            if (items.length > 1) {
                Array.from(items).slice(1).forEach(item => item.remove());
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('reactionRoleModal'));
            modal.show();
        });
        
        // Edit reaction role
        document.querySelectorAll('.edit-reaction-role').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                document.getElementById('reaction-role-index').value = index;
                document.getElementById('reactionRoleModalLabel').textContent = 'Edit Reaction Role';
                
                // Get reaction role data
                const reactionRoles = JSON.parse(document.getElementById('reaction-roles-data').textContent);
                const rr = reactionRoles[index];
                
                // Fill form
                document.getElementById('reaction-role-channel').value = rr.channelId;
                document.getElementById('reaction-role-message').value = rr.message || '';
                document.getElementById('reaction-role-message-id').value = rr.messageId || '';
                
                // Clear reaction roles container
                const container = document.getElementById('reaction-roles-container');
                container.innerHTML = '';
                
                // Add reaction role items
                rr.roles.forEach((role, i) => {
                    const template = `
                        <div class="reaction-role-item mb-2 d-flex align-items-center">
                            <input type="text" class="form-control me-2" name="roles[${i}].emoji" placeholder="Emoji" value="${role.emoji}" required>
                            <select class="form-select me-2" name="roles[${i}].roleId" required>
                                <option value="">Select a role</option>
                                ${Array.from(document.querySelector('#reaction-role-form select[name="roles[0].roleId"]').options).map(option => 
                                    `<option value="${option.value}" ${option.value === role.roleId ? 'selected' : ''} style="color: ${option.style.color}">${option.text}</option>`
                                ).join('')}
                            </select>
                            <button type="button" class="btn btn-danger remove-reaction-role-item"><i class="fas fa-times"></i></button>
                        </div>
                    `;
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = template.trim();
                    const newItem = tempDiv.firstChild;
                    
                    container.appendChild(newItem);
                    
                    // Add event listener to the new remove button
                    newItem.querySelector('.remove-reaction-role-item').addEventListener('click', removeReactionRoleItem);
                });
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('reactionRoleModal'));
                modal.show();
            });
        });
        
        // Delete reaction role
        document.querySelectorAll('.delete-reaction-role').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this reaction role?')) {
                    const index = this.getAttribute('data-index');
                    
                    // Send delete request
                    fetch(`/api/server/${window.location.pathname.split('/')[2]}/reaction-roles/${index}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Reload page
                            window.location.reload();
                        } else {
                            alert('Failed to delete reaction role: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while deleting the reaction role.');
                    });
                }
            });
        });
        
        // Add reaction role item
        document.getElementById('add-reaction-role-item').addEventListener('click', function() {
            const container = document.getElementById('reaction-roles-container');
            const items = container.querySelectorAll('.reaction-role-item');
            const newIndex = items.length;
            
            const template = `
                <div class="reaction-role-item mb-2 d-flex align-items-center">
                    <input type="text" class="form-control me-2" name="roles[${newIndex}].emoji" placeholder="Emoji" required>
                    <select class="form-select me-2" name="roles[${newIndex}].roleId" required>
                        <option value="">Select a role</option>
                        ${Array.from(items[0].querySelector('select').options).map(option => 
                            `<option value="${option.value}" style="color: ${option.style.color}">${option.text}</option>`
                        ).join('')}
                    </select>
                    <button type="button" class="btn btn-danger remove-reaction-role-item"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = template.trim();
            const newItem = tempDiv.firstChild;
            
            container.appendChild(newItem);
            
            // Add event listener to the new remove button
            newItem.querySelector('.remove-reaction-role-item').addEventListener('click', removeReactionRoleItem);
        });
        
        // Remove reaction role item
        document.querySelectorAll('.remove-reaction-role-item').forEach(btn => {
            btn.addEventListener('click', removeReactionRoleItem);
        });
        
        function removeReactionRoleItem() {
            const container = document.getElementById('reaction-roles-container');
            const items = container.querySelectorAll('.reaction-role-item');
            
            // Don't remove if it's the last item
            if (items.length <= 1) {
                return;
            }
            
            this.closest('.reaction-role-item').remove();
            
            // Update indices
            container.querySelectorAll('.reaction-role-item').forEach((item, index) => {
                item.querySelector('input').name = `roles[${index}].emoji`;
                item.querySelector('select').name = `roles[${index}].roleId`;
            });
        }
        
        // Save reaction role
        document.getElementById('save-reaction-role').addEventListener('click', function() {
            const form = document.getElementById('reaction-role-form');
            
            // Check if form is valid
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Get form data
            const formData = new FormData(form);
            const data = {
                index: formData.get('index'),
                channelId: formData.get('channelId'),
                message: formData.get('message'),
                messageId: formData.get('messageId'),
                roles: []
            };
            
            // Get roles
            const container = document.getElementById('reaction-roles-container');
            const items = container.querySelectorAll('.reaction-role-item');
            
            items.forEach((item, index) => {
                data.roles.push({
                    emoji: formData.get(`roles[${index}].emoji`),
                    roleId: formData.get(`roles[${index}].roleId`)
                });
            });
            
            // Send data
            fetch(`/api/server/${window.location.pathname.split('/')[2]}/reaction-roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Hide modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('reactionRoleModal'));
                    modal.hide();
                    
                    // Reload page
                    window.location.reload();
                } else {
                    alert('Failed to save reaction role: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while saving the reaction role.');
            });
        });
    }

    // Toggle webhook options based on announcement type
    const announcementType = document.getElementById('announcementType');
    const webhookOptions = document.getElementById('webhookOptions');
    
    if (announcementType && webhookOptions) {
        announcementType.addEventListener('change', function() {
            if (this.value === 'webhook') {
                webhookOptions.style.display = 'block';
            } else {
                webhookOptions.style.display = 'none';
            }
        });
    }
    
    // Handle select all channels checkbox
    const selectAllChannels = document.getElementById('selectAllChannels');
    const channelCheckboxes = document.querySelectorAll('.channel-checkbox');
    
    if (selectAllChannels && channelCheckboxes.length > 0) {
        selectAllChannels.addEventListener('change', function() {
            channelCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
        
        // Update "select all" checkbox when individual checkboxes change
        channelCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const allChecked = Array.from(channelCheckboxes).every(cb => cb.checked);
                const someChecked = Array.from(channelCheckboxes).some(cb => cb.checked);
                
                selectAllChannels.checked = allChecked;
                selectAllChannels.indeterminate = someChecked && !allChecked;
            });
        });
    }
    
    // Handle announcement form submission
    const announcementForm = document.getElementById('announcementForm');
    
    if (announcementForm) {
        announcementForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Sending...';
            
            // Get form data
            const formData = new FormData(this);
            const formDataObj = {};
            
            formData.forEach((value, key) => {
                if (formDataObj[key]) {
                    if (!Array.isArray(formDataObj[key])) {
                        formDataObj[key] = [formDataObj[key]];
                    }
                    formDataObj[key].push(value);
                } else {
                    formDataObj[key] = value;
                }
            });
            
            // Send the request
            fetch(this.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            })
            .then(response => response.json())
            .then(data => {
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                
                if (data.success) {
                    // Show success message
                    const successAlert = document.createElement('div');
                    successAlert.className = 'alert alert-success alert-dismissible fade show mt-3';
                    successAlert.innerHTML = `
                        <strong>Success!</strong> Announcement sent successfully.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;
                    
                    // Add details if available
                    if (data.results) {
                        let details = '';
                        if (data.results.success.length > 0) {
                            details += `<div>Successfully sent to ${data.results.success.length} channel(s)</div>`;
                        }
                        if (data.results.failed.length > 0) {
                            details += `<div>Failed to send to ${data.results.failed.length} channel(s)</div>`;
                        }
                        
                        if (details) {
                            successAlert.innerHTML += `<div class="mt-2">${details}</div>`;
                        }
                    }
                    
                    announcementForm.insertAdjacentElement('beforebegin', successAlert);
                    
                    // Reset form
                    announcementForm.reset();
                    webhookOptions.style.display = 'none';
                    
                    // Update recent announcements list
                    // This would require additional implementation
                } else {
                    // Show error message
                    const errorAlert = document.createElement('div');
                    errorAlert.className = 'alert alert-danger alert-dismissible fade show mt-3';
                    errorAlert.innerHTML = `
                        <strong>Error!</strong> ${data.error || 'Failed to send announcement'}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;
                    
                    if (data.details) {
                        errorAlert.innerHTML += `<div class="mt-2">${data.details}</div>`;
                    }
                    
                    announcementForm.insertAdjacentElement('beforebegin', errorAlert);
                }
            })
            .catch(error => {
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                
                // Show error message
                const errorAlert = document.createElement('div');
                errorAlert.className = 'alert alert-danger alert-dismissible fade show mt-3';
                errorAlert.innerHTML = `
                    <strong>Error!</strong> An unexpected error occurred.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    <div class="mt-2">${error.message}</div>
                `;
                
                announcementForm.insertAdjacentElement('beforebegin', errorAlert);
            });
        });
    }
});

$(document).ready(function() {
    // Initialize tooltips and popovers
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Form submission
    $('#general-form, #automod-form, #welcome-form, #logging-form, #autoroles-form, #reaction-role-form, #moderation-form, #verification-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {};
        const formArray = $(this).serializeArray();
        
        // Convert form data to nested object
        formArray.forEach(item => {
            if (item.name.includes('.')) {
                const parts = item.name.split('.');
                let obj = formData;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!obj[parts[i]]) obj[parts[i]] = {};
                    obj = obj[parts[i]];
                }
                
                obj[parts[parts.length - 1]] = item.value;
            } else {
                formData[item.name] = item.value;
            }
        });
        
        // Add checkbox values
        $(this).find('input[type="checkbox"]').each(function() {
            const name = $(this).attr('name');
            
            if (name.includes('.')) {
                const parts = name.split('.');
                let obj = formData;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!obj[parts[i]]) obj[parts[i]] = {};
                    obj = obj[parts[i]];
                }
                
                obj[parts[parts.length - 1]] = $(this).is(':checked');
            } else {
                formData[name] = $(this).is(':checked');
            }
        });
        
        // Send data to server
        $.ajax({
            url: `/api/server/${guildId}/settings`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    // Show success toast
                    const toast = new bootstrap.Toast(document.getElementById('successToast'));
                    toast.show();
                }
            }
        });
    });
    
    // Save all button
    $('#save-all').on('click', function() {
        // Submit all forms
        $('#general-form, #automod-form, #welcome-form, #logging-form, #autoroles-form, #reaction-role-form, #moderation-form, #verification-form').submit();
    });

    // Auto Roles
    $('#add-autorole').on('click', function() {
        const index = $('.autorole-item').length;
        const template = `
            <div class="autorole-item mb-2 d-flex align-items-center">
                <select class="form-select me-2" name="autoroles.roles[${index}]">
                    <option value="">Select a role</option>
                    ${roleOptions}
                </select>
                <button type="button" class="btn btn-danger remove-autorole"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        $('.autoroles-container').append(template);
    });
    
    $(document).on('click', '.remove-autorole', function() {
        if ($('.autorole-item').length > 1) {
            $(this).closest('.autorole-item').remove();
            
            // Update indices
            $('.autorole-item').each(function(index) {
                $(this).find('select').attr('name', `autoroles.roles[${index}]`);
            });
        } else {
            alert('You must have at least one role in the list.');
        }
    });

    // Reaction Roles
    $('#create-reaction-role').on('click', function() {
        // Reset form
        $('#reaction-role-form')[0].reset();
        $('#reaction-role-index').val('-1');
        $('#reaction-roles-container').html(`
            <div class="reaction-role-item mb-2 d-flex align-items-center">
                <input type="text" class="form-control me-2" name="roles[0].emoji" placeholder="Emoji" required>
                <select class="form-select me-2" name="roles[0].roleId" required>
                    <option value="">Select a role</option>
                    ${roleOptions}
                </select>
                <button type="button" class="btn btn-danger remove-reaction-role-item"><i class="fas fa-times"></i></button>
            </div>
        `);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('reactionRoleModal'));
        modal.show();
    });
    
    $(document).on('click', '.edit-reaction-role', function() {
        const index = $(this).data('index');
        
        // Fetch reaction role data
        $.ajax({
            url: `/api/server/${guildId}/reaction-roles/${index}`,
            type: 'GET',
            success: function(data) {
                if (data.success) {
                    const rr = data.reactionRole;
                    
                    // Fill form
                    $('#reaction-role-index').val(index);
                    $('#reaction-role-channel').val(rr.channelId);
                    $('#reaction-role-message').val(rr.message || '');
                    $('#reaction-role-message-id').val(rr.messageId || '');
                    
                    // Add role items
                    $('#reaction-roles-container').empty();
                    rr.roles.forEach((role, i) => {
                        $('#reaction-roles-container').append(`
                            <div class="reaction-role-item mb-2 d-flex align-items-center">
                                <input type="text" class="form-control me-2" name="roles[${i}].emoji" placeholder="Emoji" value="${role.emoji}" required>
                                <select class="form-select me-2" name="roles[${i}].roleId" required>
                                    <option value="">Select a role</option>
                                    ${roleOptions.replace(`value="${role.roleId}"`, `value="${role.roleId}" selected`)}
                                </select>
                                <button type="button" class="btn btn-danger remove-reaction-role-item"><i class="fas fa-times"></i></button>
                            </div>
                        `);
                    });
                    
                    // Show modal
                    const modal = new bootstrap.Modal(document.getElementById('reactionRoleModal'));
                    modal.show();
                }
            }
        });
    });
    
    $(document).on('click', '.delete-reaction-role', function() {
        if (confirm('Are you sure you want to delete this reaction role?')) {
            const index = $(this).data('index');
            
            $.ajax({
                url: `/api/server/${guildId}/reaction-roles/${index}`,
                type: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        // Reload page
                        location.reload();
                    }
                }
            });
        }
    });
    
    $('#add-reaction-role-item').on('click', function() {
        const index = $('.reaction-role-item').length;
        const template = `
            <div class="reaction-role-item mb-2 d-flex align-items-center">
                <input type="text" class="form-control me-2" name="roles[${index}].emoji" placeholder="Emoji" required>
                <select class="form-select me-2" name="roles[${index}].roleId" required>
                    <option value="">Select a role</option>
                    ${roleOptions}
                </select>
                <button type="button" class="btn btn-danger remove-reaction-role-item"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        $('#reaction-roles-container').append(template);
    });
    
    $(document).on('click', '.remove-reaction-role-item', function() {
        if ($('.reaction-role-item').length > 1) {
            $(this).closest('.reaction-role-item').remove();
            
            // Update indices
            $('.reaction-role-item').each(function(index) {
                $(this).find('input').attr('name', `roles[${index}].emoji`);
                $(this).find('select').attr('name', `roles[${index}].roleId`);
            });
        } else {
            alert('You must have at least one role in the list.');
        }
    });
    
    $('#save-reaction-role').on('click', function() {
        // Validate form
        const form = $('#reaction-role-form')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const formData = {};
        const formArray = $('#reaction-role-form').serializeArray();
        
        // Convert form data to nested object
        formArray.forEach(item => {
            if (item.name.includes('.')) {
                const parts = item.name.split('.');
                let obj = formData;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!obj[parts[i]]) obj[parts[i]] = {};
                    obj = obj[parts[i]];
                }
                
                obj[parts[parts.length - 1]] = item.value;
            } else if (item.name === 'index') {
                formData.index = item.value;
            } else {
                formData[item.name] = item.value;
            }
        });
        
        // Process roles
        formData.roles = [];
        $('.reaction-role-item').each(function() {
            const emoji = $(this).find('input[name^="roles"]').val();
            const roleId = $(this).find('select[name^="roles"]').val();
            
            if (emoji && roleId) {
                formData.roles.push({
                    emoji: emoji,
                    roleId: roleId
                });
            }
        });
        
        // Send data to server
        $.ajax({
            url: `/api/server/${guildId}/reaction-roles`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    // Hide modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('reactionRoleModal'));
                    modal.hide();
                    
                    // Reload page
                    location.reload();
                }
            }
        });
    });

    // Module Toggle
    $('.module-toggle').on('change', function() {
        const module = $(this).data('module');
        const enabled = $(this).is(':checked');
        
        // Enable/disable all commands in this module
        $(`.command-toggle[data-module="${module}"]`).prop('checked', enabled);
        
        // Save module settings
        saveModuleSettings();
    });
    
    $('.command-toggle').on('change', function() {
        saveModuleSettings();
    });
    
    $('#save-modules').on('click', function() {
        saveModuleSettings();
        
        // Show success toast
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        toast.show();
    });
    
    function saveModuleSettings() {
        const modules = {};
        
        // Collect module settings
        $('.module-toggle').each(function() {
            const module = $(this).data('module');
            const enabled = $(this).is(':checked');
            
            modules[module] = {
                enabled: enabled,
                commands: {}
            };
            
            // Collect command settings for this module
            $(`.command-toggle[data-module="${module}"]`).each(function() {
                const command = $(this).data('command');
                const enabled = $(this).is(':checked');
                
                modules[module].commands[command] = enabled;
            });
        });
        
        // Send data to server
        $.ajax({
            url: `/api/server/${guildId}/modules`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ modules: modules }),
            success: function(response) {
                if (response.success) {
                    console.log('Module settings saved');
                }
            }
        });
    }

    // Embed Builder
    const embedPreview = {
        title: 'Embed Title',
        description: 'This is a preview of your embed. Fill out the form to customize it.',
        color: '#ff3333',
        footer: {
            text: 'Footer Text',
            icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
        }
    };
    
    function updateEmbedPreview() {
        const title = $('#embed-title').val() || embedPreview.title;
        const description = $('#embed-description').val() || embedPreview.description;
        const color = $('#embed-color').val() || embedPreview.color;
        const footerText = $('#embed-footer').val() || 'Footer Text';
        const footerIcon = $('#embed-footer-icon').val() || 'https://cdn.discordapp.com/embed/avatars/0.png';
        const authorName = $('#embed-author').val();
        const authorIcon = $('#embed-author-icon').val();
        
        // Update color preview
        $('#color-preview').css('background-color', color);
        
        // Update embed preview
        let previewHtml = '';
        
        // Author
        if (authorName) {
            previewHtml += `<div class="embed-author d-flex align-items-center mb-2">`;
            if (authorIcon) {
                previewHtml += `<img src="${authorIcon}" alt="Author Icon" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">`;
            }
            previewHtml += `<span>${authorName}</span></div>`;
        }
        
        // Title
        previewHtml += `<div class="embed-title">${title}</div>`;
        
        // Description
        previewHtml += `<div class="embed-description">${description.replace(/\n/g, '<br>')}</div>`;
        
        // Image
        const imageUrl = $('#embed-image').val();
        if (imageUrl) {
            previewHtml += `<div class="embed-image mt-2"><img src="${imageUrl}" alt="Embed Image" style="max-width: 100%; max-height: 300px; border-radius: 4px;"></div>`;
        }
        
        // Footer
        previewHtml += `<div class="embed-footer">`;
        if (footerIcon) {
            previewHtml += `<img src="${footerIcon}" alt="Footer Icon">`;
        }
        previewHtml += `${footerText}</div>`;
        
        // Update preview
        $('.embed-preview').html(previewHtml);
        $('.embed-preview').css('border-left-color', color);
    }
    
    // Update preview on input change
    $('#embed-title, #embed-description, #embed-color, #embed-footer, #embed-footer-icon, #embed-author, #embed-author-icon, #embed-image').on('input', function() {
        updateEmbedPreview();
    });
    
    // Preview button
    $('#preview-embed').on('click', function() {
        updateEmbedPreview();
    });
    
    // Reset button
    $('#reset-embed').on('click', function() {
        $('#embed-builder-form')[0].reset();
        updateEmbedPreview();
    });
    
    // Send embed
    $('#send-embed').on('click', function() {
        // Validate form
        const channelId = $('#embed-channel').val();
        if (!channelId) {
            alert('Please select a channel');
            return;
        }
        
        const embedData = {
            channelId: channelId,
            embed: {
                title: $('#embed-title').val(),
                description: $('#embed-description').val(),
                color: $('#embed-color').val().replace('#', ''),
                thumbnail: $('#embed-thumbnail').val() ? { url: $('#embed-thumbnail').val() } : null,
                image: $('#embed-image').val() ? { url: $('#embed-image').val() } : null,
                footer: $('#embed-footer').val() ? {
                    text: $('#embed-footer').val(),
                    icon_url: $('#embed-footer-icon').val() || null
                } : null,
                author: $('#embed-author').val() ? {
                    name: $('#embed-author').val(),
                    icon_url: $('#embed-author-icon').val() || null
                } : null,
                timestamp: $('#embed-timestamp').is(':checked') ? new Date().toISOString() : null
            }
        };
        
        // Send data to server
        $.ajax({
            url: `/api/server/${guildId}/send-embed`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(embedData),
            success: function(response) {
                if (response.success) {
                    // Show success toast
                    const toast = new bootstrap.Toast(document.getElementById('successToast'));
                    toast.show();
                    
                    // Reset form
                    $('#embed-builder-form')[0].reset();
                    updateEmbedPreview();
                }
            }
        });
    });
    
    // Variable click
    $('.variable').on('click', function() {
        const variable = $(this).data('variable');
        const textarea = $('#embed-description');
        
        // Insert variable at cursor position
        const cursorPos = textarea.prop('selectionStart');
        const textBefore = textarea.val().substring(0, cursorPos);
        const textAfter = textarea.val().substring(cursorPos);
        
        textarea.val(textBefore + variable + textAfter);
        
        // Update preview
        updateEmbedPreview();
    });

    // Initialize color preview
    $('#color-preview').css('background-color', $('#embed-color').val());
});

// Get guild ID from URL
const guildId = window.location.pathname.split('/').pop();

// Role options for dropdowns
let roleOptions = '';
if (typeof roles !== 'undefined') {
    roles.forEach(role => {
        const style = role.color !== '#000000' ? `style="color: ${role.color}"` : '';
        roleOptions += `<option value="${role.id}" ${style}>${role.name}</option>`;
    });
} 